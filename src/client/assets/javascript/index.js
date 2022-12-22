// The store will hold all information needed globally
let store = {
  track_id: undefined,
  player_id: undefined,
  race_id: undefined,
};

// We need our javascript to wait until the DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
  onPageLoad();
  setupClickHandlers();
});

async function onPageLoad() {
  const racersNames = ['Mario', 'Bowser', 'Luigi', 'Peach', 'Toadette'];
  const tracksNames = ['Circuit', 'Stadium', 'Snow', 'Jungle', 'Fire', 'City'];
  try {
    getTracks().then((tracks) => {
      console.log(tracks);
      const newTracks = tracks.map((track, i) => {
        track.name = tracksNames[i];
        return track;
      });
      const html = renderTrackCards(newTracks);
      renderAt('#tracks', html);
    });

    getRacers().then((racers) => {
      const newRacers = racers.map((racer, i) => {
        racer.driver_name = racersNames[i];
        return racer;
      });
      const html = renderRacerCars(newRacers);
      renderAt('#racers', html);
    });
  } catch (error) {
    console.log('Problem getting tracks and racers ::', error.message);
    console.error(error);
  }
}

function setupClickHandlers() {
  document.addEventListener(
    'click',
    function (event) {
      const { target } = event;

      // Race track form field
      if (target.matches('.card.track')) {
        handleSelectTrack(target);
      }

      // Podracer form field
      if (target.matches('.card.podracer')) {
        handleSelectPodRacer(target);
      }

      // Submit create race form
      if (target.matches('#submit-create-race')) {
        event.preventDefault();
        // start race
        handleCreateRace();
      }

      // Handle acceleration click
      if (target.matches('#gas-peddle')) {
        handleAccelerate();
      }
    },
    false
  );
}

async function delay(ms) {
  try {
    return await new Promise((resolve) => setTimeout(resolve, ms));
  } catch (error) {
    console.log("an error shouldn't be possible here");
    console.log(error);
  }
}

// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace() {
  //Get player_id and track_id from the store
  const { track_id, player_id } = store;

  // const race = TODO - invoke the API call to create the race, then save the result
  const race = await createRace(player_id, track_id);
  // TODO - update the store with the race id
  store.race_id = parseInt(race.ID) - 1;
  console.log(race);

  // render starting UI
  renderAt('#race', renderRaceStartView(race.Track, race.Cars));

  // start runCountdown
  await runCountdown();

  // start the race
  await startRace(store.race_id);

  // TODO - call the async function runRace
  await runRace(store.race_id, race.Track);
}

const runRace = (raceID, track) => {
  // console.log(await getRace(raceID));
  return new Promise((resolve) => {
    const runRaceInterval = setInterval(async () => {
      const raceInfo = await getRace(raceID);
      console.log(raceInfo);
      if (raceInfo.status === 'in-progress') {
        renderAt('#leaderBoard', raceProgress(raceInfo.positions, track));
      } else if (raceInfo.status === 'finished') {
        clearInterval(runRaceInterval); // to stop the interval from repeating

        renderAt('#race', resultsView(raceInfo.positions, track)); // to render the results view
        resolve(raceInfo); // resolve the promise
      }
    }, 500);
  }).catch((error) => console.log(error));
};

async function runCountdown() {
  try {
    // wait for the DOM to load
    await delay(1000);
    let timer = 3;

    return new Promise((resolve) => {
      const countDownInterval = setInterval(() => {
        // run this DOM manipulation to decrement the countdown for the user
        document.getElementById('big-numbers').innerHTML = --timer;
        if (timer === 0) {
          clearInterval(countDownInterval);
          resolve('Done counting!');
        }
      }, 1000);
    });
  } catch (error) {
    console.log(error);
  }
}

function handleSelectPodRacer(target) {
  console.log('selected a pod', target.id);

  // remove class selected from all racer options
  const selected = document.querySelector('#racers .selected');
  if (selected) {
    selected.classList.remove('selected');
  }

  // add class selected to current target
  target.classList.add('selected');
  store.player_id = target.id;
}

function handleSelectTrack(target) {
  // remove class selected from all track options
  const selected = document.querySelector('#tracks .selected');
  if (selected) {
    selected.classList.remove('selected');
  }

  // add class selected to current target
  target.classList.add('selected');
  store.track_id = target.id;
}

const handleAccelerate = () => {
  // TODO - Invoke the API call to accelerate
  accelerate(store.race_id);
};

// HTML VIEWS ------------------------------------------------
function renderRacerCars(racers) {
  if (!racers.length) {
    return `
			<h4>Loading Racers...</4>
		`;
  }

  const results = racers.map(renderRacerCard).join('');

  return `
		<ul id="racers">
			${results}
		</ul>
	`;
}

function renderRacerCard(racer) {
  const { id, driver_name, top_speed, acceleration, handling } = racer;

  return `
		<li class="card podracer" id="${id}">
			<h3>${driver_name}</h3>
			<p>Top Speed: ${top_speed}</p>
			<p>Acceleration: ${acceleration}</p>
			<p>Handling: ${handling}</p>
		</li>
	`;
}

function renderTrackCards(tracks) {
  if (!tracks.length) {
    return `
			<h4>Loading Tracks...</4>
		`;
  }
  const results = tracks.map(renderTrackCard).join('');
  return results;
}

function renderTrackCard(track) {
  const { id, name } = track;

  return `
		<li id="${id}" class="card track">
			<h3>${name}</h3>
		</li>
	`;
}

function renderCountdown(count) {
  return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`;
}

function renderRaceStartView(track, racers) {
  return `
		<header>
			 <h1>Race: ${track.name}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>

			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`;
}

function resultsView(positions, track) {
  positions.sort((a, b) => (a.final_position > b.final_position ? 1 : -1));

  return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			${raceProgress(positions, track)}
			<a href="/race">Start a new race</a>
		</main>
	`;
}

function raceProgress(positions, track) {
  let userPlayer = positions.find((e) => e.id === parseInt(store.player_id));
  userPlayer.driver_name += ' (you)';
  console.log(track);
  // const percentages = positions.map((p) =>
  //   Math.round((p.segment / track.segments.length) * 100)
  // );
  // console.log(percentages);
  positions = positions.sort((a, b) => (a.segment > b.segment ? -1 : 1));
  console.log(positions);
  // let count = 1;

  const results = positions.map((p, i) => {
    const progress = Math.round((p.segment / track.segments.length) * 100);
    return `
			<tr>
				<td>
          <h3>${i + 1} - ${p.driver_name} - ${progress}</h3>
				</td>
			</tr>

		`;
  });

  return `
		<main>
			<h3>Leaderboard</h3>
			<section id="leaderBoard">
				${results.join('')}
			</section>
		</main>
	`;
}

function renderAt(element, html) {
  const node = document.querySelector(element);

  node.innerHTML = html;
}

// API CALLS ------------------------------------------------

const SERVER = 'http://localhost:3001';

function defaultFetchOpts() {
  return {
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': SERVER,
    },
  };
}

const getTracks = async () => {
  try {
    const response = await fetch(`${SERVER}/api/tracks`);
    const tracks = await response.json();
    return tracks;
  } catch (error) {
    console.log(error);
  }
};

const getRacers = async () => {
  try {
    const response = await fetch(`${SERVER}/api/cars`);
    const cars = await response.json();
    return cars;
  } catch (error) {
    console.log(error);
  }
};

const createRace = (player_id, track_id) => {
  player_id = parseInt(player_id);
  track_id = parseInt(track_id);
  const body = { player_id, track_id };

  return fetch(`${SERVER}/api/races`, {
    method: 'POST',
    ...defaultFetchOpts(),
    dataType: 'jsonp',
    body: JSON.stringify(body),
  })
    .then((res) => res.json())
    .catch((err) => console.log('Problem with createRace request::', err));
};

const getRace = async (id) => {
  return fetch(`${SERVER}/api/races/${id}`)
    .then((res) => res.json())
    .catch((err) => console.log(err));
};

const startRace = (id) => {
  return fetch(`${SERVER}/api/races/${id}/start`, {
    method: 'POST',
    ...defaultFetchOpts(),
  }).catch((err) => console.log('Problem with startRace request::', err));
};

// POST request to `${SERVER}/api/races/${id}/accelerate`
// options parameter provided as defaultFetchOpts
// no body or datatype needed for this request
function accelerate(id) {
  return fetch(`${SERVER}/api/races/${id}/accelerate`, {
    method: 'POST',
    ...defaultFetchOpts,
  }).catch((error) => console.log(error));
}

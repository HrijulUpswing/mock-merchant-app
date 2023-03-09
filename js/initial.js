const SERVER_BASE_URL = 'http://localhost:9000';
const THREEDS_SERVER_BASE_URL = 'http://localhost:8081';

let intervalId;

async function formSubmit(e) {
	e.preventDefault();
	const cardNumber = document.getElementById('cardNumber').value;
	const purchaseAmount = document.getElementById('purchaseAmount').value;
	const threeDsRequestBody = { cardNumber, purchaseAmount };
	let threeDsResponse;

	try {
		const response = await fetch(`${THREEDS_SERVER_BASE_URL}/initiateAReq`, {
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(threeDsRequestBody),
			method: 'POST',
		});

		threeDsResponse = await response.json();
	} catch (err) {
		console.error('Error while submitting data to 3ds mock server: ', err);
	}

	if (threeDsResponse.transactionStatus === 'C') {
		this.action = threeDsResponse.acsURL;

		const cReq = {
			acsTransID: threeDsResponse.acsTransID,
			challengeWindowSize: '03',
			messageType: 'CReq',
			messageVersion: '2.2.0',
			threeDSServerTransID: threeDsResponse.threeDSServerTransID,
		};
		const base64EncodedCReq = btoa(JSON.stringify(cReq)).replace(/=/g, '');

		const postRequestBody = {
			creq: base64EncodedCReq,
			threeDSServerTransID: threeDsResponse.threeDSServerTransID,
		};

		createIFrame();

		postRequestWithFormBehaviour(threeDsResponse.acsURL, postRequestBody);
	} else {
		window.location.assign('/success');
	}

	intervalId = setInterval(checkChallengeStatus, 2500);
}

document.getElementById('form').onsubmit = formSubmit;

// ====================== utility / helper functions ======================

async function checkChallengeStatus() {
	try {
		const response = await fetch(`${SERVER_BASE_URL}/status`);
		const data = await response.json();

		if (response.status === 200 && data.status === 'SUCCESS') {
			clearInterval(intervalId);
			window.location.assign('/success');
		} else if (response.status === 200 && data.status === 'FAILURE') {
			clearInterval(intervalId);
			window.location.assign('/failure');
		}
	} catch (err) {
		console.error('Something went wrong while checking status: ', err);
	}
}

/**
 * Takes a URL and a POST request body, and submits the POST request with a
 * form behaviour (resulting in location and document change without an
 * additional GET request to fetch the next document)
 *
 * @param url The URL to submit the request to and change the location to
 * @param body The body of the POST request
 */
function postRequestWithFormBehaviour(url, body) {
	const form = document.createElement('form');
	form.method = 'POST';
	form.action = url;
	form.target = 'challengeFrame';

	for (const [key, value] of Object.entries(body)) {
		const inputField = document.createElement('input');
		inputField.type = 'hidden';
		inputField.name = key;
		inputField.value = value;
		form.appendChild(inputField);
	}

	document.body.appendChild(form);
	form.submit();
}

function createIFrame() {
	const challengeFrame = document.createElement('iframe');
	challengeFrame.name = 'challengeFrame';
	challengeFrame.id = 'challengeFrame';
	document.body.appendChild(challengeFrame);
}

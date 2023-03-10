const SERVER_BASE_URL = 'http://localhost:9000';
const THREEDS_SERVER_BASE_URL = 'http://localhost:8081';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let intervalId;

const loader = document.querySelector('#loader');
const checkoutButton = document.querySelector('#checkoutButton');
const paymentDetails = document.querySelector('#paymentDetails');
const paymentDetailsForm = document.querySelector('#paymentDetailsForm');
const price = document.querySelector('#price > span');

async function formSubmit(e) {
	e.preventDefault();
	const cardNumber = document.getElementById('cardNumber').value;
	const purchaseAmount = price.innerText;
	const threeDsRequestBody = { cardNumber, purchaseAmount };
	let threeDsResponse;

	try {
		showLoader();
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
	} finally {
		hideLoader();
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

checkoutButton.onclick = async () => {
	showLoader();
	await sleep(1000);
	hideLoader();
	paymentDetails.style.display = 'flex';
};

paymentDetails.onclick = () => {
	paymentDetails.style.display = 'none';
};

paymentDetailsForm.onclick = (event) => {
	event.stopPropagation();
};

price.onkeydown = (event) => {
	if (
		!(
			// only allow the following keys in the price span
			(
				event.code.includes('Digit') ||
				event.code.includes('Numpad') ||
				event.code === 'ArrowLeft' ||
				event.code === 'ArrowRight' ||
				event.code === 'Backspace' ||
				event.code === 'Delete' ||
				event.code === 'Period'
			)
		)
	) {
		event.preventDefault();
	}
};

paymentDetailsForm.onsubmit = formSubmit;

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

function showLoader() {
	loader.style.display = 'flex';
}

function hideLoader() {
	loader.style.display = 'none';
}

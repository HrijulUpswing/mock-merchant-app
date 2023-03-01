const SERVER_BASE_URL = "http://localhost:9000";

let intervalId;

function formSubmit(e) {
    e.preventDefault();
    intervalId = setInterval(checkChallengeStatus, 2500);
    console.log("submit event: ", e);
    console.log(this);
    this.submit();
}

document.getElementById("form").onsubmit = formSubmit;

// ====================== utility / helper functions ======================

async function checkChallengeStatus() {
    try {
        const response = await fetch(`${SERVER_BASE_URL}/status`);
        if (response.status === 200) {
            window.location.assign("/success");
        }
    } catch (err) {
        console.error("Something went wrong while checking status: ", err);
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
    const form = document.createElement("form");
    form.method = "POST";
    form.action = url;

    for (const [key, value] of Object.entries(body)) {
        const inputField = document.createElement("input");
        inputField.type = "hidden";
        inputField.name = key;
        inputField.value = value;
        form.appendChild(inputField);
    }

    document.body.appendChild(form);
    form.submit();
}

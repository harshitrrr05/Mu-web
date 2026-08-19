const KEY = "dateInvite";


/* =========================
   LOCAL STORAGE
========================= */

function getData() {

    try {
        return JSON.parse(
            localStorage.getItem(KEY) || "{}"
        );
    } catch {
        return {};
    }
}


function saveData(data) {

    localStorage.setItem(
        KEY,
        JSON.stringify({
            ...getData(),
            ...data
        })
    );
}


/* =========================
   HOME PAGE - NO BUTTON
========================= */

const noBtn = document.getElementById("noBtn");

if (noBtn) {

    noBtn.addEventListener("mouseenter", function () {

        const x = Math.random() * 120 - 60;
        const y = Math.random() * 80 - 40;

        noBtn.style.transform =
            `translate(${x}px, ${y}px)`;

        const hint =
            document.getElementById("hint");

        if (hint) {

            hint.textContent =
                "That button seems a little shy 😂❤️";
        }

    });

}


/* =========================
   DATE PAGE
========================= */

function saveDate() {

    const dateInput =
        document.getElementById("date");

    const timeInput =
        document.getElementById("time");

    const error =
        document.getElementById("error");

    const date =
        dateInput ? dateInput.value : "";

    const time =
        timeInput ? timeInput.value : "";

    if (!date || !time) {

        if (error) {
            error.textContent =
                "Please choose both date and time ♡";
        }

        return;
    }

    saveData({
        date: date,
        time: time
    });

    location.href = "food.html";
}


/* =========================
   FOOD SELECTION
========================= */

const foodButtons =
    document.querySelectorAll(".food");

foodButtons.forEach(food => {

    food.addEventListener("click", function () {

        food.classList.toggle("selected");

    });

});


/* =========================
   SEND NOTIFICATION
========================= */

async function sendNotification(data) {

    const response = await fetch(
        "/.netlify/functions/notify",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                date: data.date,
                time: data.time,
                foods: data.foods
            })
        }
    );

    let result = {};

    try {
        result = await response.json();
    } catch {
        result = {};
    }

    if (!response.ok || !result.success) {

        throw new Error(
            result.error ||
            "Notification could not be sent"
        );
    }

    return result;
}


/* =========================
   CONFIRM DATE
========================= */

async function confirmDate() {

    const selectedFoods =
        [
            ...document.querySelectorAll(
                ".food.selected"
            )
        ].map(food => food.dataset.food);

    const error =
        document.getElementById("error");

    const button =
        document.querySelector(
            '[onclick="confirmDate()"]'
        );


    /* No food selected */

    if (selectedFoods.length === 0) {

        if (error) {
            error.textContent =
                "Choose at least one food ♡";
        }

        return;
    }


    /* Get existing date/time */

    const existingData = getData();

    if (!existingData.date || !existingData.time) {

        if (error) {
            error.textContent =
                "Please choose the date and time first ♡";
        }

        return;
    }


    /* Final data */

    const finalData = {

        date: existingData.date,

        time: existingData.time,

        foods: selectedFoods

    };


    /* Save locally */

    saveData(finalData);


    /* Prevent double click */

    if (button) {

        button.disabled = true;

        button.textContent =
            "Confirming... ♡";
    }

    if (error) {
        error.textContent =
            "Sending confirmation... ❤️";
    }


    try {

        /* Send email */

        await sendNotification(finalData);


        /* Success */

        if (error) {
            error.textContent =
                "Confirmed successfully ❤️";
        }


        /* Small delay so user sees message */

        setTimeout(() => {

            location.href =
                "success.html";

        }, 500);


    } catch (err) {

        console.error(err);


        if (button) {

            button.disabled = false;

            button.textContent =
                "This sounds perfect ♡";
        }


        if (error) {

            error.textContent =
                "Could not send confirmation. Please try again.";
        }

    }

}


/* =========================
   SUCCESS PAGE
========================= */

const summary =
    document.getElementById("summary");

if (summary) {

    const data = getData();

    const foods =
        Array.isArray(data.foods)
            ? data.foods.join(", ")
            : "-";


    summary.innerHTML = `
        📅 <b>${escapeHtml(data.date || "-")}</b><br>
        ⏰ <b>${escapeHtml(data.time || "-")}</b><br>
        🍽️ <b>${escapeHtml(foods)}</b>
    `;
}


/* =========================
   HTML ESCAPE
========================= */

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
const KEY = "dateInvite";

/* =========================
   LOCAL STORAGE
========================= */

function getData() {
    try {
        return JSON.parse(localStorage.getItem(KEY) || "{}");
    } catch (error) {
        console.error("LocalStorage read error:", error);
        return {};
    }
}

function saveData(data) {
    const currentData = getData();

    localStorage.setItem(
        KEY,
        JSON.stringify({
            ...currentData,
            ...data
        })
    );
}


/* =========================
   NO BUTTON
========================= */

const noBtn = document.getElementById("noBtn");

if (noBtn) {
    noBtn.addEventListener("mouseenter", () => {
        const x = Math.random() * 120 - 60;
        const y = Math.random() * 80 - 40;

        noBtn.style.transform = `translate(${x}px, ${y}px)`;

        const hint = document.getElementById("hint");

        if (hint) {
            hint.textContent =
                "That button seems a little shy 😂❤️";
        }
    });
}


/* =========================
   DATE
========================= */

function saveDate() {
    const dateInput = document.getElementById("date");
    const timeInput = document.getElementById("time");
    const error = document.getElementById("error");

    const date = dateInput?.value || "";
    const time = timeInput?.value || "";

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

    window.location.href = "food.html";
}


/* =========================
   FOOD SELECTION
========================= */

document.querySelectorAll(".food").forEach((food) => {

    food.addEventListener("click", () => {
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

    const responseText = await response.text();

    let result;

    try {
        result = JSON.parse(responseText);
    } catch (error) {
        console.error(
            "Invalid server response:",
            responseText
        );

        throw new Error(
            `Server returned invalid response (${response.status})`
        );
    }

    if (!response.ok || result.success !== true) {

        throw new Error(
            result.error ||
            `Notification failed (${response.status})`
        );
    }

    return result;
}


/* =========================
   CONFIRM DATE
========================= */

async function confirmDate() {

    const selectedFoods = [
        ...document.querySelectorAll(".food.selected")
    ].map((food) => food.dataset.food);

    const error = document.getElementById("error");

    const button =
        document.querySelector(
            '[onclick="confirmDate()"]'
        );


    /* =========================
       FOOD REQUIRED
    ========================= */

    if (selectedFoods.length === 0) {

        if (error) {
            error.textContent =
                "Choose at least one food ♡";
        }

        return;
    }


    /* =========================
       GET SAVED DATE/TIME
    ========================= */

    const existingData = getData();

    if (!existingData.date || !existingData.time) {

        if (error) {
            error.textContent =
                "Please choose the date and time first ♡";
        }

        return;
    }


    /* =========================
       FINAL DATA
    ========================= */

    const finalData = {
        date: existingData.date,
        time: existingData.time,
        foods: selectedFoods
    };


    /* =========================
       SAVE
    ========================= */

    saveData(finalData);


    /* =========================
       DISABLE BUTTON
    ========================= */

    if (button) {
        button.disabled = true;
        button.textContent = "Confirming... ♡";
    }

    if (error) {
        error.textContent =
            "Sending confirmation... ❤️";
    }


    /* =========================
       SEND EMAIL
    ========================= */

    try {

        await sendNotification(finalData);

        saveData({
            notificationSent: true
        });

        if (error) {
            error.textContent =
                "Confirmed successfully ❤️";
        }

    } catch (errorObject) {

        console.error(
            "Notification error:",
            errorObject
        );

        saveData({
            notificationSent: false
        });

        if (error) {
            error.textContent =
                "Confirmed ❤️ Opening your summary...";
        }
    }

    setTimeout(() => {
        window.location.href = "success.html";
    }, 500);
}


/* =========================
   SUCCESS PAGE
========================= */

const summary = document.getElementById("summary");

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

    const emailStatus =
        document.getElementById("emailStatus");

    if (
        emailStatus &&
        data.notificationSent === false
    ) {
        emailStatus.textContent =
            "Your choices were saved, but the email notification could not be delivered.";
    }
}


/* =========================
   ESCAPE HTML
========================= */

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

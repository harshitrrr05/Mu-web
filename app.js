const KEY = "dateInvite";


function getData() {
    return JSON.parse(
        localStorage.getItem(KEY) || "{}"
    );
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
   FUNNY NO BUTTON
========================= */

const noBtn = document.getElementById("noBtn");

if (noBtn) {

    noBtn.addEventListener("mouseenter", function () {

        const x = Math.random() * 120 - 60;
        const y = Math.random() * 80 - 40;

        noBtn.style.transform =
            `translate(${x}px,${y}px)`;

        const hint =
            document.getElementById("hint");

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

    const date =
        document.getElementById("date").value;

    const time =
        document.getElementById("time").value;

    const error =
        document.getElementById("error");


    if (!date || !time) {

        error.textContent =
            "Please choose both date and time ♡";

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

document.querySelectorAll(".food").forEach(food => {

    food.addEventListener("click", () => {

        food.classList.toggle("selected");

    });

});


/* =========================
   SEND EMAIL
========================= */

async function sendNotification(data) {

    try {

        const response = await fetch(
            "/.netlify/functions/notify",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(data)
            }
        );


        const result =
            await response.json();


        if (!response.ok || !result.success) {

            console.error(
                "Notification failed:",
                result
            );

            return false;
        }


        console.log(
            "Notification email sent!"
        );

        return true;

    } catch (error) {

        console.error(
            "Notification error:",
            error
        );

        return false;
    }
}


/* =========================
   CONFIRM DATE
========================= */

async function confirmDate() {

    const foods =
        [...document.querySelectorAll(".food.selected")]
        .map(food => food.dataset.food);


    const error =
        document.getElementById("error");


    if (foods.length === 0) {

        error.textContent =
            "Choose at least one food ♡";

        return;
    }


    const oldData = getData();


    const finalData = {

        date: oldData.date || "",
        time: oldData.time || "",
        foods: foods

    };


    saveData({
        foods: foods
    });


    const button =
        document.querySelector(".wide");


    if (button) {

        button.disabled = true;

        button.textContent =
            "Confirming... ♡";
    }


    // Send notification
    await sendNotification(finalData);


    // Open success page
    location.href = "success.html";
}


/* =========================
   SUCCESS PAGE SUMMARY
========================= */

const summary =
    document.getElementById("summary");


if (summary) {

    const data = getData();


    summary.innerHTML = `

        📅 <b>${data.date || "-"}</b>
        <br>

        ⏰ <b>${data.time || "-"}</b>
        <br>

        🍽️ <b>
        ${(data.foods || []).join(", ") || "-"}
        </b>

    `;
}
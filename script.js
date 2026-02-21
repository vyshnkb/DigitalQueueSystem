function login() {
    let name = document.getElementById("studentName").value.trim();

    if (name === "") {
        document.getElementById("loginError").textContent = "Please enter your name!";
        return;
    }

    // Hide login
    document.getElementById("loginPage").style.display = "none";

    // Show main page
    const mainPage = document.getElementById("mainPage");
    mainPage.style.display = "block";

    // Auto scroll to token / display area
    const tokenSection = document.getElementById("displayArea");
    tokenSection.scrollIntoView({ behavior: "smooth" });

    
}

// ===== QUEUE SYSTEM =====
let queue = [];
let tokenNumber = 1;
let currentOrder = null;
let timer = null;
let rewardPoints = {};
let isServing = false;

function addToQueue() {
    let name = document.getElementById("nameInput").value.trim();
    let selectedItems = [];
    let checkboxes = document.querySelectorAll("input[type=checkbox]:checked");
    checkboxes.forEach(cb => selectedItems.push(cb.value));

    if (name === "" || selectedItems.length === 0) { alert("Enter name & select items"); return; }

    queue.push({ token: tokenNumber, name, items: selectedItems });
    tokenNumber++;
    displayQueue();
    document.getElementById("nameInput").value = "";
    checkboxes.forEach(cb => cb.checked = false);

    if (!isServing) serveNext();
}

function displayQueue() {
    let list = document.getElementById("queueList");
    list.innerHTML = "";
    queue.forEach(order => {
        let li = document.createElement("li");
        li.textContent = `Token ${order.token} | ${order.name} | Items: ${order.items.join(", ")}`;
        list.appendChild(li);
    });
}

function serveNext() {
    if (queue.length === 0) {
        isServing = false;
        currentOrder = null;
        document.getElementById("displayArea").innerHTML = "<h2>No Orders in Queue</h2>";
        document.getElementById("completeBtn").style.display = "none";
        return;
    }

    isServing = true;
    currentOrder = queue.shift();

    document.getElementById("displayArea").innerHTML =
        `<h2>Now Serving</h2>
        <h1>Token ${currentOrder.token}</h1>
        <p>Name: ${currentOrder.name}</p>
        <p>Items: ${currentOrder.items.join(", ")}</p>
        <p style='color:orange;'>Collect within 10 seconds</p>`;
    document.getElementById("completeBtn").style.display = "inline-block";
    displayQueue();

    clearTimeout(timer);
    timer = setTimeout(skipOrder, 10000); // auto skip after 10s
}

function completeOrder() {
    if (!currentOrder) return;
    clearTimeout(timer);

    if (!rewardPoints[currentOrder.name]) rewardPoints[currentOrder.name] = 0;
    rewardPoints[currentOrder.name] += 10;

    document.getElementById("displayArea").innerHTML =
        `<h2 style='color:green;'>Token ${currentOrder.token} Completed ✅</h2>
        <p>+10 Reward Points 🎉</p>`;

    document.getElementById("completeBtn").style.display = "none";
    updateLeaderboard();
    checkSpinEligibility(currentOrder.name);

    setTimeout(serveNext, 2000);
}

function skipOrder() {
    if (!currentOrder) return;
    document.getElementById("displayArea").innerHTML =
        `<h2 style='color:red;'>Token ${currentOrder.token} Skipped ❌</h2>`;
    document.getElementById("completeBtn").style.display = "none";
    setTimeout(serveNext, 2000);
}

function updateLeaderboard() {
    let leaderboard = Object.entries(rewardPoints)
        .sort((a, b) => b[1] - a[1])
        .map(([name, points]) => `<li>${name}: ${points} points</li>`)
        .join("");
    document.getElementById("leaderboard").innerHTML = leaderboard;
}

function checkSpinEligibility(name) {
    if (rewardPoints[name] >= 30) {
        document.getElementById("spinWheelContainer").style.display = "block";
        drawWheel();
    }
}

// ===== SPIN WHEEL =====
const spinRewards = ["🥤 Free Juice", "🍔 Free Burger", "🍟 Free Fries", "🍕 Free Pizza", "🎉 Better Luck Next Time"];
const canvas = document.getElementById("spinWheel");
const ctx = canvas.getContext("2d");
const segments = spinRewards.length;
const angle = 2 * Math.PI / segments;
let isSpinning = false;

function drawWheel() {
    for (let i = 0; i < segments; i++) {
        ctx.beginPath();
        ctx.moveTo(150, 150);
        ctx.arc(150, 150, 150, i * angle, (i + 1) * angle);
        ctx.fillStyle = i % 2 === 0 ? "#ffdede" : "#ffe4b3";
        ctx.fill();
        ctx.stroke();

        ctx.save();
        ctx.translate(150, 150);
        ctx.rotate((i + 0.5) * angle);
        ctx.textAlign = "right";
        ctx.fillStyle = "#333";
        ctx.font = "14px Arial";
        ctx.fillText(spinRewards[i], 140, 0);
        ctx.restore();
    }
}

document.getElementById("spinBtn").addEventListener("click", function () {
    if (isSpinning) return;
    isSpinning = true;
    document.getElementById("spinBtn").disabled = true;

    const spinTime = 6000 + Math.random() * 2000; // 6–8 seconds
    let start = null;

    // total rotation: 6 full spins + random
    const totalRotation = Math.random() * 2 * Math.PI + 12 * Math.PI;

    function animate(timestamp) {
        if (!start) start = timestamp;
        const progress = timestamp - start;
        const t = Math.min(progress / spinTime, 1);

        // easing
        const ease = easeOutCubic(t);

        // current angle
        const angleNow = ease * totalRotation;

        // rotate wheel
        canvas.style.transform = `rotate(${angleNow}rad)`;

        if (progress < spinTime) {
            requestAnimationFrame(animate);
        } else {

            /* ---------------- RESULT CALCULATION ---------------- */

            // normalize rotation to 0 → 2π
            const finalRotation = (angleNow % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);

            // pointer is at TOP (12 o'clock) = 270° = 3π/2
            const pointerAngle = (3 * Math.PI) / 2;

            // relative angle between pointer and wheel
            const relativeAngle = (pointerAngle - finalRotation + 2 * Math.PI) % (2 * Math.PI);

            // size of each slice
            const sliceAngle = (2 * Math.PI) / segments;

            // winning index
            const winningIndex = Math.floor(relativeAngle / sliceAngle);

            /* ---------------------------------------------------- */

            // show result
            document.getElementById("spinResult").innerHTML =
                "🎁 You Won: " + spinRewards[winningIndex];

            // celebration
            confetti();

            // reset state
            isSpinning = false;
            document.getElementById("spinBtn").disabled = false;
        }
    }

    requestAnimationFrame(animate);
});

// easing function
function easeOutCubic(t) {
    return (--t) * t * t + 1;
}
// ===== CONFETTI =====
function confetti() {
    const confettiCanvas = document.getElementById("confettiCanvas");
    const ctx = confettiCanvas.getContext("2d");
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;

    const confettiCount = 150;
    const pieces = [];

    for (let i = 0; i < confettiCount; i++) {
        pieces.push({
            x: Math.random() * confettiCanvas.width,
            y: Math.random() * confettiCanvas.height - confettiCanvas.height,
            size: Math.random() * 8 + 4,
            color: `hsl(${Math.random() * 360},90%,55%)`,
            tilt: Math.random() * 10 - 10,
            tiltAngle: Math.random() * Math.PI,
            tiltSpeed: Math.random() * 0.1 + 0.05,
            speed: Math.random() * 3 + 2
        });
    }

    const startTime = Date.now();
    const duration = 6000;

    function draw() {
        const elapsed = Date.now() - startTime;
        ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

        for (let i = 0; i < pieces.length; i++) {
            const p = pieces[i];
            p.y += p.speed;
            p.tiltAngle += p.tiltSpeed;
            p.tilt = Math.sin(p.tiltAngle) * 10;
            if (p.y > confettiCanvas.height) { p.y = -p.size; p.x = Math.random() * confettiCanvas.width; }

            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.fillRect(p.x + p.tilt, p.y, p.size, p.size / 2);
            ctx.fill();
        }

        if (elapsed < duration) requestAnimationFrame(draw);
        else ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
    draw();
}
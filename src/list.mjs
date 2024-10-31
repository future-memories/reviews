import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, query, where, orderBy, limit, getDoc, setDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

let $ = (selector) => document.querySelector(selector);

const reviewDB = getFirestore(initializeApp({
    projectId: "id-fm-reviews",
    appId: "1:139765414634:web:34544f92eeb915b3f27593",
    apiKey: "AIzaSyCSaGPsgk4PiNAL2bp0h_lq6VDBdOFdAWM",
    authDomain: "id-fm-reviews.firebaseapp.com",
    storageBucket: "id-fm-reviews.appspot.com",
    messagingSenderId: "139765414634",
    measurementId: "G-DN5NWXVX7N"
}, "fm-reviews"));

let sha256 = async (s) => {
    let encoder = new TextEncoder();
    let buf = await window.crypto.subtle.digest("SHA-256", encoder.encode(s))
    let arr = Array.from(new Uint8Array(buf));
    // return btoa(arr.map(b => String.fromCharCode(b)).join(''));
    return arr.map(b => b.toString(16).padStart(2, '0')).join('');
};

// IMPORTANT: This auth sucks and will not stop any sufficiently capable
// "hacker" from "cracking" it however it works as a quick PoC and doesn't store
// the password in plaintext in the script
let ensureLoggedIn = async () => {
    let passwordCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("xpass="))
        ?.split("=")[1] ?? null;

    let password = passwordCookie ?? prompt("Enter the password");

    if (await sha256(password) != "b1c9b941a0a80b9df23234e646f3438ba046cafdb70c1892e19c997f514ad7ff") {
        alert(passwordCookie == null ? "Incorrect password" : "Password has changed. Clear your cookies.");
        throw new Error("Incorrect password");
    } else {
        let maxAge = 1 * 60 * 60 * 24 * 365; // 1 year in seconds
        document.cookie = `xpass=${password}; max-age=${maxAge}`;
    }

    console.log("logged in");
};

let parseReviewId = (reviewId) => {
    let reviewRegex = new RegExp('^(?<userId>[0-9a-zA-Z]{28})-(?<startSeconds>\\d+)-(?<endSeconds>\\d+)$');
    let m = reviewRegex.exec(reviewId);
    if (m == null) {
        alert('Invalid reviewId format');
        throw new Error('Invalid reviewId format');
    }
    return [
        m.groups.userId,
        m.groups.startSeconds,
        m.groups.endSeconds,
    ];
};

let getReviewIds = async () => {
    try {
        let q = query(collection(reviewDB, "reviews"), limit(500));
        return (await getDocs(q)).docs.map(doc => doc.id);
    } catch (error) {
        console.error("X-Error:", error);
        throw error;
    }
};

let deleteReview = async (reviewId) => {
    try {
        let ref = doc(reviewDB, "reviews", reviewId);
        let archiveRef = doc(reviewDB, "archive", reviewId);
        let review = await getDoc(ref);
        await setDoc(archiveRef, review);
        await deleteDoc(ref);
    } catch (error) {
        console.error("X-Error:", error);
        throw error;
    }
};

let createEntry = (data) => {
    let entry = document.createElement('li');

    let text = document.createElement('span');
    text.innerHTML = `Review <a href="print.html?reviewId=${data["id"]}">${data["id"]}</a> (<span class="start">${data["start"]}</span> - <span class="end">${data["end"]}</span>)`;
    entry.appendChild(text);

    let btnEdit = document.createElement('button');
    btnEdit.innerText = "Edit";
    btnEdit.addEventListener('click', (_e) => {
        // TODO: add until parameter
        window.location.href = `review.html?userId=${user}&since=${startSeconds}&until=${endSeconds}`;
    });
    entry.appendChild(btnEdit);

    let btnDelete = document.createElement('button');
    btnDelete.innerText = "Delete";
    btnDelete.addEventListener('click', async (_e) => {
        if (confirm(`Delete review ${data["id"]}?`)) {
            await deleteReview(data["id"]);
            window.location.reload();
        }
    });
    entry.appendChild(btnDelete);
    return entry;
};

await ensureLoggedIn();

window.reviews = {};
window.reviewIds = await getReviewIds();
window.reviewIds.forEach(reviewId => {
    let [user, startSeconds, endSeconds] = parseReviewId(reviewId);
    if (!window.reviews.hasOwnProperty(user)) window.reviews[user] = [];

    window.reviews[user].push({
        'id': reviewId,
        'userId': user,
        'startSeconds': startSeconds,
        'endSeconds': endSeconds,
        'start': new Date(startSeconds * 1000).toISOString().split('.')[0].replace('T', ' '),
        'end': new Date(endSeconds * 1000).toISOString().split('.')[0].replace('T', ' '),
    });
});

let onLoad = async () => {
    let main = $("main");
    main.innerHTML = ""; // clear loading screen
    main.style = "";

    for (let user in window.reviews) {
        let div = document.createElement('div');
        let list = document.createElement('ul');
        div.innerHTML = `<h3>User: ${user}</h3>`;
        div.appendChild(list);
        window.reviews[user].sort((a, b) => a.startSeconds - b.startSeconds);
        window.reviews[user].forEach(review => list.appendChild(createEntry(review)));
        main.appendChild(div);
    }
};


if ((new RegExp("complete|interactive|loaded")).test(document.readyState)) {
    onLoad();
} else {
    document.addEventListener("DOMContentLoaded", onLoad);
}


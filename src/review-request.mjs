import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, query, where, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

let $ = (selector) => document.querySelector(selector);
// let fm = (userId) => 'FM' + userId.substring(userId.length - 6).toUpperCase();
// const url = new URLSearchParams(new URL(window.location.href).search);

const fmDB = getFirestore(initializeApp({
  projectId: "patr-3a75e",
  appId: "1:1067533396497:web:6570ade6f7fda6df8f1fb0",
  apiKey: "AIzaSyAas9R4-9q4Tyrv4LDQx1falWjmco_P4LE",
  authDomain: "patr-3a75e.firebaseapp.com",
  storageBucket: "patr-3a75e.appspot.com",
  messagingSenderId: "1067533396497",
  measurementId: "G-Y2ZJ3SMS32"
}, "fm"));

const reviewDB = getFirestore(initializeApp({
  projectId: "id-fm-reviews",
  appId: "1:139765414634:web:34544f92eeb915b3f27593",
  apiKey: "AIzaSyCSaGPsgk4PiNAL2bp0h_lq6VDBdOFdAWM",
  authDomain: "id-fm-reviews.firebaseapp.com",
  storageBucket: "id-fm-reviews.appspot.com",
  messagingSenderId: "139765414634",
  measurementId: "G-DN5NWXVX7N"
}, "fm-reviews"));

let parseUserId = (input) => {
  input = input.trim();
  let urlRe = new RegExp("^https:\/\/explorer\.futurememory\.app\/user\/(?<userId>[a-zA-Z0-9]{28})\/?$");
  let idRe = new RegExp("^(?<userId>[a-zA-Z0-9]{28})\/?$");

  let res = input.match(urlRe) ?? input.match(idRe);
  return res?.groups?.userId ?? null;
};

let parseMemoryId = (input) => {
  input = input.trim();
  let urlRe = new RegExp("^https:\/\/explorer\.futurememory\.app\/memory\/(?<memoryId>[a-zA-Z0-9]{20})");
  let idRe = new RegExp("^(?<memoryId>[a-zA-Z0-9]{20})$");

  let res = input.match(urlRe) ?? input.match(idRe);
  return res?.groups?.memoryId ?? null;
};

let getLastReview = async (userId) => {
  try {
    let q = query(collection(reviewDB, 'reviews'), where('userId', '==', userId), orderBy('timestamp', 'desc'), limit(1));

    let results = [];
    (await getDocs(q)).forEach((doc) => {
      results.push(doc.data());
    });

    if (results.length === 1) {
      return results[0];
    } else {
      throw new Error(`[W]No memories found for user "${userId}"`);
    }
  } catch (error) {
    let isWarning = error.message.startsWith("[W]");
    let message = isWarning ? error.message.substring(3) : error.message;
    (isWarning ? console.warn : console.error)(`X-Error[getLastReview]: ${message}`);
    return null;
  }
};

let getMemory = async (memoryId) => {
  try {
    let q = query(collection(fmDB, 'memory'), where('imageId', '==', memoryId), limit(1));

    let results = [];
    (await getDocs(q)).forEach((doc) => {
      results.push(doc.data());
    });

    if (results.length === 1) {
      return results[0];
    } else {
      throw new Error(`[W]Memory not found. memoryId = "${memoryId}"`);
    }
  } catch (error) {
    let isWarning = error.message.startsWith("[W]");
    let message = isWarning ? error.message.substring(3) : error.message;
    (isWarning ? console.warn : console.error)(`X-Error[getMemory]: ${message}`);
    return null;
  }
};

let onSubmit = async (e) => {
  e.preventDefault(); // prevent default form behavior
  let quit = (msg) => { alert(msg); return false };
  let redirect = (userId, timestamp) => window.location.href = `review?userId=${userId}&since=${timestamp.seconds}`;

  let userId = parseUserId($("#user").value);
  if (userId == null) return quit("Invalid user ID");

  let review = await getLastReview(userId);
  if (review != null) return redirect(userId, review.timestamp);

  let inputLastMemory = $("#last-memory").value;
  if (inputLastMemory == "") {
    $('#last-memory').style.display = 'block';
    return quit("No reviews found for this user. Please input last reviewed memory (as URL or ID) and resubmit.");
  }

  if (inputLastMemory == "ALL") return redirect(userId, {seconds: 0});

  let memoryId = parseMemoryId(inputLastMemory);
  if (memoryId == null) return quit("Invalid memory ID");

  let lastMemory = await getMemory(memoryId);
  if (lastMemory == null) return quit("Memory not found");
  if (lastMemory.type != "Uploaded") return quit("Memory is not of type 'Uploaded'");
  if (lastMemory.creatorId != userId) return quit("Memory does not belong to the user");

  return redirect(userId, lastMemory.timestamp);
};

document.addEventListener("DOMContentLoaded", (_event) => {
  $("#review-request-form").addEventListener("submit", onSubmit);
});

let tests = () => {
  console.assert(parseUserId("random") === null, "Test 1 failed");
  console.assert(parseUserId("https://explorer.futurememory.app/user/71nxIAj6SKeYBBTv7wiKYh03ap62") === "71nxIAj6SKeYBBTv7wiKYh03ap62", "Test 2 failed");
  console.assert(parseUserId("https://explorer.futurememory.app/user/71nxIAj6SKeYBBTv7wiKYh03ap62/") === "71nxIAj6SKeYBBTv7wiKYh03ap62", "Test 3 failed");
  console.assert(parseUserId("  https://explorer.futurememory.app/user/71nxIAj6SKeYBBTv7wiKYh03ap62/  ") === "71nxIAj6SKeYBBTv7wiKYh03ap62", "Test 4 failed");
  console.assert(parseUserId("cgEEM9ZNv1etWS3CYkZUiiSHEMl1") === "cgEEM9ZNv1etWS3CYkZUiiSHEMl1", "Test 5 failed");
  console.assert(parseUserId("  cgEEM9ZNv1etWS3CYkZUiiSHEMl1/") === "cgEEM9ZNv1etWS3CYkZUiiSHEMl1", "Test 6 failed");
  console.assert(parseMemoryId("https://explorer.futurememory.app/memory/uMaImW1aDuroALTgIOBU/associations") === "uMaImW1aDuroALTgIOBU", "Test 7 failed");
  console.assert(parseMemoryId("uMaImW1aDuroALTgIOBU") === "uMaImW1aDuroALTgIOBU", "Test 8 failed");
  console.assert(parseMemoryId("uMaImW1aDuroALTgIOBU  ") === "uMaImW1aDuroALTgIOBU", "Test 9 failed");
};
tests();

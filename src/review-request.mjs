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

let tests = () => {
  console.assert(parseUserId("random") === null, "Test 1 failed");
  console.assert(parseUserId("https://explorer.futurememory.app/user/71nxIAj6SKeYBBTv7wiKYh03ap62") === "71nxIAj6SKeYBBTv7wiKYh03ap62", "Test 2 failed");
  console.assert(parseUserId("https://explorer.futurememory.app/user/71nxIAj6SKeYBBTv7wiKYh03ap62/") === "71nxIAj6SKeYBBTv7wiKYh03ap62", "Test 3 failed");
  console.assert(parseUserId("  https://explorer.futurememory.app/user/71nxIAj6SKeYBBTv7wiKYh03ap62/  ") === "71nxIAj6SKeYBBTv7wiKYh03ap62", "Test 4 failed");
  console.assert(parseUserId("cgEEM9ZNv1etWS3CYkZUiiSHEMl1") === "cgEEM9ZNv1etWS3CYkZUiiSHEMl1", "Test 5 failed");
  console.assert(parseUserId("  cgEEM9ZNv1etWS3CYkZUiiSHEMl1/") === "cgEEM9ZNv1etWS3CYkZUiiSHEMl1", "Test 6 failed");
};
tests();

let getLastReviewedMemory = (userId) => {

};

try {
  let q = query(collection(fmDB, 'users'), limit(10));
  let users = [];
  let querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => {
    users.push(doc.data());
  });
  console.log(users);
} catch (error) {
  console.error("X-Error: ", error);
}

// document.addEventListener("DOMContentLoaded", (_event) => {
// });

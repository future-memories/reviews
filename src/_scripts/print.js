import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, setDoc, and, doc, collection, query, where, orderBy, limit, getDoc, getDocs, Timestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

let $ = (selector) => document.querySelector(selector);
const url = new URLSearchParams(new URL(window.location.href).search);

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

let getReview = async (reviewId) => {
  try {
    let docSnap = await getDoc(doc(reviewDB, 'reviews', reviewId));
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      alert('Review not found');
      throw new Error('Review not found');
    }
  } catch (error) {
    console.error("X-Error:", error);
    throw error;
  }
};

let getMemories = async (userId, startSeconds, endSeconds) => {
  let memoryData = [];
  try {
    let q = query(
      collection(fmDB, 'memory'),
      and(
        where('userId', '==', userId),
        where('timestamp', '>=', new Date(Number(startSeconds) * 1000)),
        where('timestamp', '<', new Date((Number(endSeconds) + 1) * 1000)),
      ),
      orderBy('timestamp', 'desc')
    );
    (await getDocs(q)).forEach((doc) => {
      let data = doc.data(); // client-side filtering, due to no index for type
      if (data.type == 'Uploaded') {
        memoryData.push(data);
      }
    });
  } catch (error) {
    console.error("X-Error:", error);
    throw error;
  }
  console.log('mem[0]', memoryData[0]);
  return memoryData;
};

let createMemoryCard = (data) => {
  let img = document.createElement('img');
  img.src = `https://xiw.io/cdn-cgi/image/width=85,quality=80/${data.imageUrl}`;
  return img;
};

let reviewId = url.get('reviewId');
if (reviewId == null) {
  alert('Required URL parameter `reviewId` is missing');
  throw new Error('Required URL parameter `reviewId` is missing');
}

let reviewRegex = new RegExp('^(?<userId>[0-9a-zA-Z]{28})-(?<startSeconds>\\d+)-(?<endSeconds>\\d+)$');
let reviewMatch = reviewRegex.exec(reviewId);
if (reviewMatch == null) {
  alert('Invalid reviewId format');
  throw new Error('Invalid reviewId format');
}

let userId = reviewMatch.groups.userId;
let startSeconds = reviewMatch.groups.startSeconds;
let endSeconds = reviewMatch.groups.endSeconds;

window.memoryData = await getMemories(userId, startSeconds, endSeconds);
window.memoryCards = window.memoryData.map(data => createMemoryCard(data));
window.review = await getReview(reviewId);

let statusReverseMap = {
  0: 'pending', // should never exist
  1: 'good',
  2: 'bad',
  3: 'task',
  4: 'fail',
};
for (let i = 0; i < window.memoryCards.length; i++) {
  window.memoryCards[i].className = statusReverseMap[window.review.data[i]];
}


let onLoad = (_event) => {
  console.log('[EVENT] DOMContentLoaded');
  let main = $('main');
  window.memoryCards.forEach(card => {
    main.appendChild(card);
  });

  $('#review .userId').innerText = userId;
  $('#review .periodStart').innerText = new Date(startSeconds * 1000).toLocaleString();
  $('#review .periodEnd').innerText = new Date(endSeconds * 1000).toLocaleString();
  if (window.review.comment == null || window.review.comment == "") {
    $('#review .commentRow').style.display = 'none';
  } else {
    $('#review .comment').innerText = window.review.comment;
  }

  $('header > h1').innerText = window.review.displayName;

  $('#summary .eligible').innerText = window.review.reviewSummary.eligible;
  $('#summary .task').innerText = window.review.reviewSummary.task;
  $('#summary .total').innerText = window.review.reviewSummary.total;

  $('footer .reviewId').innerText = reviewId;

  // setTimeout(() => {
  //   console.log('[EVENT] window.print()');
  //   window.print();
  // }, 1000);
}

if ((new RegExp("complete|interactive|loaded")).test(document.readyState)) {
  onLoad();
} else {
  document.addEventListener("DOMContentLoaded", onLoad);
}

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, query, where, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

let $ = (selector) => document.querySelector(selector);
let fm = (userId) => 'FM' + userId.substring(userId.length - 6).toUpperCase();
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


let getMemories = async () => {
  let userId = url.get('userId');
  if (userId == null) {
    alert('Required URL parameter `userId` is missing');
    throw new Error('Required URL parameter `userId` is missing');
  }

  let lastReviewedMemoryTimestamp = url.get('since'); // in seconds
  if (lastReviewedMemoryTimestamp == null) {
    alert('Required URL parameter `since` is missing');
    throw new Error('Required URL parameter `since` is missing');
  }

  let memoryData = [];
  try {
    let q = query(
      collection(fmDB, 'memory'),
      where('userId', '==', userId),
      where('timestamp', '>', new Date(lastReviewedMemoryTimestamp * 1000)),
      orderBy('timestamp', 'desc'),
      limit(100)
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
  let card = document.createElement('div');
  card.className = 'card';

  let img = document.createElement('img');
  img.src = `https://xiw.io/cdn-cgi/image/width=400,quality=95/${data.imageUrl}`;
  card.appendChild(img);

  let text = document.createElement('p');
  text.innerHTML = `
  <span class="userId float-l">${fm(data.userId)}</span>
  <br>
  <span class="country">${data.country}</span>
  `;
  card.appendChild(text);

  return card;
};

window.memoryData = await getMemories();
window.memoryCards = window.memoryData.map(data => createMemoryCard(data));
window.reviewState = {
  index: 0,
  reviewed: 0,
  total: window.memoryData.length,
  data: window.memoryData.map(_ => ({ status: 'pending' })),
  moveIndexBy(delta) {
    this.index = (this.index + delta + this.total) % this.total;
  },
  getPercentageReviewed() {
    let percentage = Math.round(this.reviewed / this.total * 100 * 100) / 100;
    return isNaN(percentage) ? 0 : percentage;
  },
  getStatus() { return this.data[this.index].status },
  setStatus(status) {
    this.reviewed += this.getStatus() == 'pending' ? 1 : 0;
    this.data[this.index].status = status;
    this.getMemoryCard().querySelector('img').className = status;
  },
  getMemory() { return window.memoryData[this.index] },
  getMemoryCard() { return window.memoryCards[this.index] },
};

let onLoad = (_event) => {
  console.log('[EVENT] DOMContentLoaded');
  let main = $('main');
  window.memoryCards.forEach(card => {
    main.appendChild(card);
  });
  document.dispatchEvent(new Event('x-memories-ready'));
}

if ((new RegExp("complete|interactive|loaded")).test(document.readyState)) {
  onLoad();
} else {
  document.addEventListener("DOMContentLoaded", onLoad);
}

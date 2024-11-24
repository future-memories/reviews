import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, getDoc, setDoc, doc, collection, query, where, orderBy, limit, getDocs, Timestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

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

const reviewDB = getFirestore(initializeApp({
  projectId: "id-fm-reviews",
  appId: "1:139765414634:web:34544f92eeb915b3f27593",
  apiKey: "AIzaSyCSaGPsgk4PiNAL2bp0h_lq6VDBdOFdAWM",
  authDomain: "id-fm-reviews.firebaseapp.com",
  storageBucket: "id-fm-reviews.appspot.com",
  messagingSenderId: "139765414634",
  measurementId: "G-DN5NWXVX7N"
}, "fm-reviews"));

let getMemories = async () => {
  let userId = url.get('userId');
  if (userId == null) {
    alert('Required URL parameter `userId` is missing');
    throw new Error('Required URL parameter `userId` is missing');
  }

  let lastMemoryTimestamp = url.get('since'); // in seconds
  if (lastMemoryTimestamp == null) {
    alert('Required URL parameter `since` is missing');
    throw new Error('Required URL parameter `since` is missing');
  }

  let reviewEnd = url.get('until');
  // first review in the system is inclusive (the memory link ypu provide will be reviewed)
  // subsequent reviews are exclusive (the last reviewed memory will be excluded)
  let comparison = url.get('exclusive') == 'true' ? '>' : '>=';

  let memoryData = [];
  try {
    let q = reviewEnd == null ? query(
      collection(fmDB, 'memory'),
      where('userId', '==', userId),
      where('timestamp', comparison, new Date(Number(lastMemoryTimestamp) * 1000)),
      orderBy('timestamp', 'desc'),
      // limit(100),
    ) : query(
      collection(fmDB, 'memory'),
      where('userId', '==', userId),
      where('timestamp', comparison, new Date(Number(lastMemoryTimestamp) * 1000)),
      where('timestamp', '<', new Date((Number(reviewEnd) + 1) * 1000)),
      orderBy('timestamp', 'desc'),
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
  if (memoryData.length == 0) {
    alert('No new memories to review');
    throw new Error('No new memories to review');
  }
  console.log('mem[0]', memoryData[0]);
  return memoryData;
};

let getThisReview = async () => {
  let userId = url.get('userId');
  if (userId == null) throw new Error('Required URL parameter `userId` is missing');

  let start = url.get('since');
  if (start == null) throw new Error('Required URL parameter `since` is missing');

  let end = url.get('until');
  if (end == null) return null; // no reviews up to now

  try {
    let docSnap = await getDoc(doc(reviewDB, 'reviews', `${userId}-${start}-${end}`));
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      alert('The review you\'re trying to edit was not found. Please check the url.');
      throw new Error('Editing a non-existing review. WTF?');
    }
  } catch (error) {
    console.error("X-Error:", error);
    throw error;
  }
}

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
window.editReview = await getThisReview();
window.memoryCards = window.memoryData.map(data => createMemoryCard(data));
window.reviewState = {
  index: 0,
  reviewed: 0,
  total: window.memoryData.length,
  data: window.memoryData.map(_ => ({ status: 'pending' })),
  submitted: false,
  reviewId: (() => {
    let userId = url.get('userId');
    let startSeconds = window.memoryData[window.memoryData.length - 1].timestamp.seconds;
    let endSeconds = window.memoryData[0].timestamp.seconds;
    return `${userId}-${startSeconds}-${endSeconds}`
  })(),
  moveIndexBy(delta) {
    this.index = (this.index + delta + this.total) % this.total;
    if (this.submitted == false && this.reviewed == this.total && this.index == 0 && window.editReview == null) alert("Review complete!");
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

// submitting a review
let onSubmit = async (e) => {
  e.preventDefault(); // prevent default form behavior
  let quit = (msg) => { alert(msg); return false };

  if (window.reviewState.reviewed < window.reviewState.total) {
    return quit('Please review all images before submitting');
  }

  if (window.editReview != null) {
    if (!confirm(`This review already exists. Do you want to override it?`)) {
      return quit('Review submission cancelled');
    }
  }

  let statusMap = {
    'pending': 0,
    'good': 1,
    'bad': 2,
    'task': 3,
    'fail': 4,
    'extra-bad': 5,
  };
  let data = window.reviewState.data.map(d => statusMap[d.status]);
  let userId = url.get('userId');

  let review = {
    userId: userId,
    timestamp: Timestamp.now(),
    data: data,
    imageIds: window.memoryData.map(d => d.imageId),
    comment: $("#comment").value,
    total: window.reviewState.total,
    reviewSummary: {
      "total": window.reviewState.total,
      "eligible": data.filter(d => d == statusMap["good"]).length,
      "not-eligible": data.filter(d => d == statusMap["bad"] || d == statusMap["extra-bad"]).length,
      "task": data.filter(d => d == statusMap["task"]).length,
      "not-eligible-for-task": data.filter(d => d == statusMap["fail"]).length,
    },
    displayName: (() => {
      let fullDate = (new Date()).toISOString().split('T')[0];
      let eligible = data.filter(d => d == statusMap["good"]).length;
      let total = window.reviewState.total;
      return `${fm(userId)}_Review_${fullDate}_${eligible}P_${total}`;
    })(),
  };

  // upload to firebase
  try {
    await setDoc(doc(reviewDB, "reviews", window.reviewState.reviewId), review);
    window.reviewState.submitted = true;
    update(); // hacky (should be in controls.js ??)
    alert('Review submitted successfully');
  } catch (error) {
    console.error("X-Error:", error);
    alert(`Failed to submit review: "${error}"`);
  }
};

let onLoad = (_event) => {
  console.log('[EVENT] DOMContentLoaded');
  let main = $('#memories');
  window.memoryCards.forEach(card => {
    main.appendChild(card);
  });
  document.dispatchEvent(new Event('x-memories-ready'));

  $('#review > form').addEventListener('submit', onSubmit);

  $('button#btn-print').addEventListener('click', (_event) => {
    window.location.href=`print.html?reviewId=${window.reviewState.reviewId}`;
  });
}

if ((new RegExp("complete|interactive|loaded")).test(document.readyState)) {
  onLoad();
} else {
  document.addEventListener("DOMContentLoaded", onLoad);
}

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';

console.log('Hello World!');

const firebaseConfig = {
  apiKey: "AIzaSyAas9R4-9q4Tyrv4LDQx1falWjmco_P4LE",
  authDomain: "patr-3a75e.firebaseapp.com",
  projectId: "patr-3a75e",
  storageBucket: "patr-3a75e.appspot.com",
  messagingSenderId: "1067533396497",
  appId: "1:1067533396497:web:6570ade6f7fda6df8f1fb0",
  measurementId: "G-Y2ZJ3SMS32"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// var volume = 500;
let volume = 5;
let q = query(collection(db, 'memory'), orderBy('timestamp', 'desc'), limit(volume));

// imgContainer.style.backgroundImage = `url(https://xiw.io/cdn-cgi/image/width=400,quality=95/${data.imageUrl})`;

onSnapshot(q, (snapshot) => {
  snapshot.forEach((doc) => {
    const data = doc.data();
    console.log(data)
    // const card = createMemoryCard(data);
    // if (card != null) {
    //   if (firstUpdate == true) {
    //     memory_cards.push(card);
    //   } else {
    //     memory_cards.unshift(card);
    //   }
    // }
  })
});

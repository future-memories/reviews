import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, getCountFromServer, setDoc, and, doc, collection, query, where, orderBy, limit, getDoc, getDocs, Timestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

let $ = (selector) => document.querySelector(selector);

const fmDB = getFirestore(initializeApp({
    projectId: "patr-3a75e",
    appId: "1:1067533396497:web:6570ade6f7fda6df8f1fb0",
    apiKey: "AIzaSyAas9R4-9q4Tyrv4LDQx1falWjmco_P4LE",
    authDomain: "patr-3a75e.firebaseapp.com",
    storageBucket: "patr-3a75e.appspot.com",
    messagingSenderId: "1067533396497",
    measurementId: "G-Y2ZJ3SMS32"
}, "fm"));

let _time = Date.now();

// can't do "group by", we can do count on where clauses, but we need the condition for where
// let's get a list of countries (hardcoded now, stored in db later), list of active users

let getActiveCountries = async (startDate) => {
    try {
        let memories = [];
        let q = query(collection(fmDB, "memory"), where("timestamp", ">", startDate), orderBy("timestamp", "desc"));
        (await getDocs(q)).forEach((doc) => memories.push(doc.data()));
        return [...new Set(memories.map(m => m.country))];
    } catch (error) {
        console.log(error);
    }
};
// TODO: compare active countries with list

// ignore "Unknown" and " "
let countries = ["Spain", "United Kingdom", "Kenya", "Zambia", "Singapore", "Greece", "Bangladesh", "Nigeria", "France", "China", "Portugal", "Indonesia", "Israel", "Italy", "India", "Australia", "Sierra Leone", "Bosnia and Herzegovina", "United States", "Estonia", "Egypt", "Latvia", "Tanzania", "Saudi Arabia", "Malaysia", "Ghana", "United Arab Emirates", "Algeria", "Philippines", "Oman", "Switzerland", "Nepal", "Finland", "Peru", "Pakistan", "Benin", "Monaco", "Germany", "Türkiye", "Thailand", "Hungary", "Bulgaria", "Morocco", "Serbia", "Belgium"];

// make a count query for each country
// TODO: get distinct users for each country
let memoriesPerCountry = {};
countries.forEach((country) => memoriesPerCountry[country] = 0);
let startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // a week ago
// for (let country of countries) {
//     try {
//         let q = query(collection(fmDB, "memory"), where("timestamp", ">", startDate), where("country", "==", country));
//         memoriesPerCountry[country] = await getCountFromServer(q);
//     } catch (error) {
//         console.log(error);
//     }
// }
try {
    let q = query(collection(fmDB, "memory"), where("timestamp", ">", startDate));
    (await getDocs(q)).forEach((doc) => {
        let data = doc.data();
        if (data.country in memoriesPerCountry) {
            memoriesPerCountry[data.country]++;
        }
    });
} catch (error) {
    console.log(error);
}

console.log(memoriesPerCountry);
// sort by count
let sortedCountries = Object.keys(memoriesPerCountry).sort((a, b) => memoriesPerCountry[b] - memoriesPerCountry[a]);

let onLoad = () => {
    // $('main').style = '';
    $('main').innerHTML = `
    <h1>Active Countries</h1>
    <table>
        <thead>
            <tr>
                <th>Country</th>
                <th>Memories</th>
            </tr>
        </thead>
        <tbody>
            ${sortedCountries.map((country) => `<tr><td>${country}</td><td>${memoriesPerCountry[country]}</td></tr>`).join('')}
        </tbody>
    </table>
    Loaded in ${Date.now() - _time}ms
    `;
};

if ((new RegExp("complete|interactive|loaded")).test(document.readyState)) {
    onLoad();
} else {
    document.addEventListener("DOMContentLoaded", onLoad);
}

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, getCountFromServer, setDoc, and, doc, collection, query, where, orderBy, limit, getDoc, getDocs, Timestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

try {
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

let _time = Date.now();
let mostCountries = ["Spain", "United Kingdom", "Kenya", "Zambia", "Singapore", "Greece", "Bangladesh", "Nigeria", "France", "China", "Portugal", "Indonesia", "Israel", "Italy", "India", "Australia", "Sierra Leone", "Bosnia and Herzegovina", "United States", "Estonia", "Egypt", "Latvia", "Tanzania", "Saudi Arabia", "Malaysia", "Ghana", "United Arab Emirates", "Algeria", "Philippines", "Oman", "Switzerland", "Nepal", "Finland", "Peru", "Pakistan", "Benin", "Monaco", "Germany", "Türkiye", "Thailand", "Hungary", "Bulgaria", "Morocco", "Serbia", "Belgium"];

// report:
// -> id: <daily/monthly/yearly>-<iso>
//   -> daily-2024-11-05
//   -> monthly-2024-11
//   -> yearly-2024
// -> type: daily/weekly/monthly/yearly
//   -> weekly = last 7 days
//   -> daily = from last daily report (23:59:59) to now
// -> timestamp: (daily? 23:59:59) (monthly? all days from month) (yearly? all months from year)
// -> countries: sorted list of
//   -> country
//   -> count
//   -> percentage
//   -> cities: sorted list of
//     -> city
//     -> count
//     -> percentage
// -> users: sorted list of
//   -> user
//   -> count
// -> timegraph: list of
//   -> index = hour of day
//   -> value = count memories withing this hour
// -> relative timegraph: same list but with local time = timestamp + timezone_diff(country)

// cell managers reports
// per user:
// X memories since last review per user

let getDailyReport = async (dateISO, save = false) => {
    console.assert(dateISO.match(/^\d{4}-\d{2}-\d{2}$/), "Invalid dateISO format");
    let dailyRef = doc(reviewDB, "analytics", `daily-${dateISO}`);
    try {
        let snapshot = await getDoc(dailyRef);
        if (snapshot.exists()) {
            return snapshot.data();
        }
    } catch (error) {
        console.log(error);
    }
    console.log(`daily report for ${dateISO} not found, generating...`);

    let report = {
        id: `daily-${dateISO}`,
        type: "daily",
        timestamp: (new Date(dateISO)).getTime(),
        countries: [],
        users: [],
        timegraph: [],
        relativeTimegraph: null,
    };

    let memories = [];
    try {
        let date = new Date(dateISO);
        let q = query(
            collection(fmDB, "memory"),
            where("timestamp", ">=", date),
            where("timestamp", "<", new Date(date.getTime() + 24 * 60 * 60 * 1000)),
            orderBy("timestamp", "desc")
        );
        (await getDocs(q)).forEach((doc) => {
            let data = doc.data(); // then check for userId == creatorId
            if (data.type == 'Uploaded') memories.push(data);
        });
    } catch (error) {
        console.error(error);
    }

    // countries report
    let countries = [...new Set(memories.map(m => m.country))].map(c => c === " " ? "Unknown" : c);
    let total = memories.length;
    for (let country of countries) {
        let count = memories.filter(m => m.country === country).length;
        let cities = [...new Set(memories.filter(m => m.country === country).map(m => m.city))];
        // cities in `country` report
        let cityReport = [];
        for (let city of cities) {
            let cityCount = memories.filter(m => m.city === city).length;
            cityReport.push({
                city,
                count: cityCount,
                percentage: cityCount / count * 100
            });
        }
        cityReport.sort((a, b) => b.count - a.count);

        report.countries.push({
            country,
            count,
            percentage: count / total * 100,
            cities: cityReport,
        });
    }
    report.countries.sort((a, b) => b.count - a.count);

    // users report
    let users = [...new Set(memories.map(m => m.userId))];
    for (let user of users) {
        let count = memories.filter(m => m.userId === user).length;
        report.users.push({ user, count });
    }
    report.users.sort((a, b) => b.count - a.count);

    // timegraph report
    for (let i = 0; i < 24; i++) {
        let count = memories.filter(m => new Date(m.timestamp.seconds * 1000).getHours() === i).length;
        report.timegraph.push({ i, count });
    }
    // TODO: relative timegraph report

    if (!save) return report;
    // TODO: save only if period is past (for example, we can save the daily report only after the next day of 00:00)
    // or param inside the document to check completeness?

    try {
        await setDoc(dailyRef, report);
        console.log(`daily report for ${dateISO} generated and saved`);
        return report;
    } catch (error) {
        console.error(error);
    }
};

let drawCountries = () => {
    let labels = window.dailyReport.countries.map(c => c.country);
    let data = window.dailyReport.countries.map(c => c.count);
    new Chart($('#countries'), {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Memory Count by Country',
                data,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            scales: {
                x: { beginAtZero: true },
            }
        }
    });
};

let drawUsers = () => {
    let labels = window.dailyReport.users.map(u => fm(u.user));
    let data = window.dailyReport.users.map(u => u.count);
    new Chart($('#users'), {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Memory Count by User',
                data,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            scales: {
                x: { beginAtZero: true },
            }
        }
    });
};

let drawTimegraph = () => {
    let labels = window.dailyReport.timegraph.map(t => t.i);
    let data = window.dailyReport.timegraph.map(t => t.count);
    new Chart($('#timegraph'), {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Memory Count by Hour',
                data,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                x: { beginAtZero: true },
            }
        }
    });
};

// let yesterday = (new Date(Date.now() - 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
let today = (new Date()).toISOString().split('T')[0];
let reportDate = url.get('date') || today;
window.dailyReport = await getDailyReport(reportDate);


// get date from URL params, default to today
// show date in title
// better vis

// store all users, show only few of them
// top 20 users (highlight which have reviews on)
// bottom 20 users (highlight which have reviews on) (with at least one memory from period)

// weekly reports
// monthly reports -> store


let onLoad = () => {
    $('body').style = '';
    $('#spinner').remove();

    drawCountries();
    drawUsers();
    drawTimegraph();

    $('footer').innerText = `Loaded in ${Date.now() - _time}ms`;
};

if ((new RegExp("complete|interactive|loaded")).test(document.readyState)) {
    onLoad();
} else {
    document.addEventListener("DOMContentLoaded", onLoad);
}



// -----------------
} catch (error) {
    console.error(error);
}
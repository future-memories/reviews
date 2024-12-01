import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, setDoc, doc, collection, query, where, orderBy, getDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

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

let date2iso = (date) => {
    let year = date.getFullYear();
    let month = (date.getMonth() + 1).toString().padStart(2, '0');
    let day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};
let iso2date = (isoDate) => {
    let [year, month, day] = isoDate.split('-').map(Number);
    return new Date(year, month - 1, day);
}
let _time = Date.now();

// rought approximation, consider using the google maps API with the precise coordinates of each memory
let timeZoneDiff = {
    "Spain": 1,
    "United Kingdom": 0,
    "Kenya": 3,
    "Zambia": 2,
    "Singapore": 8,
    "Greece": 2,
    "Bangladesh": 6,
    "Nigeria": 1,
    "France": 1,
    "China": 8,
    "Portugal": 0,
    "Indonesia": 8, // west = +7, central = +8, east = +9
    "Israel": 2,
    "Italy": 1,
    "India": 5.5,
    "Australia": 11,
    "Sierra Leone": 0,
    "Bosnia and Herzegovina": 1,
    "United States": -8,
    "Estonia": 2,
    "Egypt": 2,
    "Latvia": 2,
    "Tanzania": 3,
    "Saudi Arabia": 3,
    "Malaysia": 8,
    "Ghana": 0,
    "United Arab Emirates": 4,
    "Algeria": 1,
    "Philippines": 8,
    "Oman": 4,
    "Switzerland": 1,
    "Nepal": 6,
    "Finland": 2,
    "Peru": -5,
    "Pakistan": 5,
    "Benin": 1,
    "Monaco": 1,
    "Germany": 1,
    "Türkiye": 3,
    "Thailand": 7,
    "Hungary": 1,
    "Bulgaria": 2,
    "Morocco": 1,
    "Serbia": 1,
    "Belgium": 1,
};
let getTimeZoneDiff = (country) => timeZoneDiff[country] || 0;
let monthSlugMap = {
    'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
    'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08',
    'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12',
};

let getReportType = (input) => {
    switch (input.length) {
        case 7:  return 'quarterly'; // YYYY-Q1
        case 8:  return 'monthly';   // YYYY-JAN
        case 10: return 'daily';     // YYYY-MM-DD
        case 15: return 'weekly';    // week-YYYY-MM-DD
        default: alert(`Invalid date format: ${input}`);
    }
};

let getReportStartDate = (input) => {
    switch (input.length) {
        case 7:
            let q_year = input.substring(0, 4);
            let q_month = ['01', '04', '07', '10'][Number(input[6]) - 1];
            return `${q_year}-${q_month}-01`;
        case 8:
            let m_year = input.substring(0, 4);
            let m_month = monthSlugMap[input.substring(5, 8).toUpperCase()];
            return `${m_year}-${m_month}-01`;
        case 10:
            return input;
        case 15:
            return input.substring('week-'.length);
        default: alert(`Invalid date format: ${input}`);
    }
};

let setLoadingStatus = (status) => {
    console.log(status);
    $('p#loading-info').innerText = status;
};

// copied from review view index.mjs
let getLastReviewTime = async (userId) => {
    try {
      // we only need the document IDs, but Firestore doesn't allow us to just fetch the IDs
      // or maybe it does, but I don't know how to do it & ChatGPT hallucinates a `select()` method
      // TODO: fix this if it eveer becomes too slow
      let q = query(
        collection(reviewDB, 'reviews'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
      );

      // order document IDs by the last image timestamp (part of the id)
      let querySnapshot = await getDocs(q);
      let documentIds = querySnapshot.docs.map(doc => doc.id).sort((a, b) => {
        let aSeconds = a.split('-').pop();
        let bSeconds = b.split('-').pop();
        return Number(bSeconds) - Number(aSeconds);
      });

      if (documentIds.length > 0) {
        return Number(documentIds[0].split('-').pop());
      } else {
        throw new Error(`[W]No reviews found for user "${userId}"`);
      }
    } catch (error) {
      let isWarning = error.message.startsWith("[W]");
      let message = isWarning ? error.message.substring(3) : error.message;
      (isWarning ? console.warn : console.error)(`X-Error[getLastReviewTime]: ${message}`);
      return null;
    }
};

// null = no reviews
let getMemoriesSinceLastReview = async (userId) => {
    let lastReviewTime = await getLastReviewTime(userId);
    if (lastReviewTime == null) return null;
    try {
        let q = query(
            collection(fmDB, "memory"),
            where("userId", "==", userId),
            where("timestamp", ">=", new Date(lastReviewTime * 1000)),
            orderBy("timestamp", "desc")
        );
        return (await getDocs(q)).size;
    } catch (error) {
        console.error(error);
    }
};

let getDailyReport = async (input) => {
    let filterCountry = url.get('country');
    // make first letter uppercase
    if (filterCountry != null) {
        filterCountry = filterCountry.charAt(0).toUpperCase() + filterCountry.slice(1);
    }

    console.assert(input.match(/^\d{4}-\d{2}-\d{2}$/), "Invalid date, expected ISO format");
    let reportId = filterCountry == null ? `daily-${input}` : `daily-${input}-${filterCountry}`;
    let dailyRef = doc(reviewDB, "analytics", reportId);
    try {
        let snapshot = await getDoc(dailyRef);
        if (snapshot.exists()) {
            return snapshot.data();
        }
    } catch (error) {
        console.log(error);
    }
    setLoadingStatus(
        (filterCountry == null ? '' : `[${filterCountry}] `) +
        `Daily report for ${input} not found, generating...`
    );

    let report = {
        id: reportId,
        type: "daily",
        filter: filterCountry,
        timestamp: iso2date(input).getTime(),
        countries: [],
        users: [],
        timegraph: [],
        total: null,
    };

    let memories = [];
    try {
        let q = filterCountry == null ? query(
            collection(fmDB, "memory"),
            where("timestamp", ">=", iso2date(input)),
            where("timestamp", "<", new Date(iso2date(input).getTime() + 24 * 60 * 60 * 1000)),
            orderBy("timestamp", "desc")
        ) : query(
            collection(fmDB, "memory"),
            where("timestamp", ">=", iso2date(input)),
            where("timestamp", "<", new Date(iso2date(input).getTime() + 24 * 60 * 60 * 1000)),
            where("country", "==", filterCountry),
            orderBy("timestamp", "desc")
        );
        (await getDocs(q)).forEach((doc) => {
            let data = doc.data(); // then check for userId == creatorId
            if (data.type == 'Uploaded') memories.push(data);
        });
    } catch (error) {
        console.error(error);
    }

    report.total = memories.length;

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
    let memoryHours = memories.map(m => new Date(m.timestamp.seconds * 1000 + getTimeZoneDiff(m.country) * 1000 * 60 * 60).getHours());
    for (let i = 0; i < 24; i++) {
        let count = memoryHours.filter(h => h === i).length;
        report.timegraph.push({ i, count });
    }

    let todayDate = date2iso(new Date());
    if (input >= todayDate) return report;

    try {
        await setDoc(dailyRef, report);
        setLoadingStatus(
            (filterCountry == null ? '' : `[${filterCountry}] `) +
            `Daily report for ${input} generated and saved`
        );
        return report;
    } catch (error) {
        console.error(error);
    }
};

let accumCountryReports = (dailyReports) => {
    let report = [];
    let countryReports = dailyReports.flatMap(d => d.countries);
    let total = countryReports.reduce((acc, c) => acc + c.count, 0);
    let distinctCountries = [...new Set(countryReports.map(c => c.country))];
    for (let country of distinctCountries) {
        let thisCountryReports = countryReports.filter(c => c.country === country);
        let count = thisCountryReports.reduce((acc, c) => acc + c.count, 0);
        let cityReports = thisCountryReports.flatMap(c => c.cities);
        let distinctCities = [...new Set(cityReports.map(c => c.city))];

        let countryReport = {
            country,
            count,
            percentage: count / total * 100,
            cities: [],
        };
        for (let city of distinctCities) {
            let cityCount = cityReports.filter(c => c.city === city).reduce((acc, c) => acc + c.count, 0);
            countryReport.cities.push({
                city,
                count: cityCount,
                percentage: cityCount / count * 100
            });
        }
        countryReport.cities.sort((a, b) => b.count - a.count);
        report.push(countryReport);
    }
    report.sort((a, b) => b.count - a.count);
    return report;
};

let accumUserReports = (dailyReports) => {
    let report = [];
    let userReports = dailyReports.flatMap(d => d.users);
    let distinctUsers = [...new Set(userReports.map(u => u.user))];
    for (let user of distinctUsers) {
        let count = userReports.filter(u => u.user === user).reduce((acc, u) => acc + u.count, 0);
        report.push({ user, count });
    }
    report.sort((a, b) => b.count - a.count);
    return report;
};

let accumTimegraph = (dailyReports) => {
    let report = [];
    let timegraphs = dailyReports.map(d => d.timegraph);
    for (let i = 0; i < 24; i++) {
        let count = timegraphs.reduce((acc, t) => acc + t[i].count, 0);
        report.push({ i, count });
    }
    return report;
};

// startDate is in ISO format
let accumDayOfWeek = (dailyReports, startDate) => {
    // weekday graph (starts from Monday)
    // shift based on which day of the week the weekly report is from
    // if the date is Wednesday, i = 0 is Wednesday, so we need to save it in report.weekdayGraph[2] (because Wednesday = 2)
    let dayOfWeek = iso2date(startDate).getUTCDay();
    let report = [1, 2, 3, 4, 5, 6, 7].map(i => ({ i, count: 0 }));

    let weekdayReports = dailyReports.map(d => d.total);
    for (let i = 0; i < weekdayReports.length; i++) {
        report[(dayOfWeek + i) % 7].count += weekdayReports[i];
    }
    return report;
};

// uses the weekdayGraph instead of dates
let accumDayOfWeek2 = (reports) => {
    let report = [1, 2, 3, 4, 5, 6, 7].map(i => ({ i, count: 0 }));
    for (let r of reports) {
        for (let i = 0; i < 7; i++) {
            report[i].count += r.weekdayGraph[i].count;
        }
    }
    return report;
};

let getWeeklyReport = async (input) => {
    let filterCountry = url.get('country');
    // make first letter uppercase
    if (filterCountry != null) {
        filterCountry = filterCountry.charAt(0).toUpperCase() + filterCountry.slice(1);
    }

    console.assert(input.match(/^week-\d{4}-\d{2}-\d{2}$/), "Invalid weekly report format, expected week-<isoDate>");
    let date = input.substring('week-'.length);

    let reportId = filterCountry == null ? `weekly-${date}` : `weekly-${date}-${filterCountry}`;
    let weeklyRef = doc(reviewDB, "analytics", reportId);
    try {
        let snapshot = await getDoc(weeklyRef);
        if (snapshot.exists()) {
            return snapshot.data();
        }
    } catch (error) {
        console.log(error);
    }
    setLoadingStatus(
        (filterCountry == null ? '' : `[${filterCountry}] `) +
        `Weekly report for ${date} not found, generating...`
    );

    let dailyReports = [];
    for (let i = 0; i < 7; i++) {
        let weekStart = iso2date(date);
        let weekIndex = date2iso(new Date(weekStart.getUTCFullYear(), weekStart.getUTCMonth(), weekStart.getUTCDate() + i));
        // the filter is globally available as a URL parameter, so it won't be ignored
        dailyReports.push(await getDailyReport(weekIndex));
    }

    let report = {
        id: reportId,
        type: "weekly",
        filter: filterCountry,
        timestamp: iso2date(input).getTime(),
        countries: [],
        users: [],
        timegraph: [],
        weekdayGraph: [],
        total: dailyReports.reduce((acc, d) => acc + d.total, 0),
    };

    report.countries = accumCountryReports(dailyReports);
    report.users = accumUserReports(dailyReports);
    report.timegraph = accumTimegraph(dailyReports);
    report.weekdayGraph = accumDayOfWeek(dailyReports, date);

    if (date2iso(new Date()) <= date) {
        setLoadingStatus(
            (filterCountry == null ? '' : `[${filterCountry}] `) +
            `Weekly report for ${date} is incomplete.`
        );
        alert(`NOTE: Weekly report for ${date} is incomplete.`);
    } else {
        try {
            await setDoc(weeklyRef, report);
            setLoadingStatus(
                (filterCountry == null ? '' : `[${filterCountry}] `) +
                `Weekly report for ${date} generated and saved`
            );
        } catch (error) {
            console.error(error);
        }
    }

    return report;
}

let getMonthlyReport = async (input) => {
    let filterCountry = url.get('country');
    // make first letter uppercase
    if (filterCountry != null) {
        filterCountry = filterCountry.charAt(0).toUpperCase() + filterCountry.slice(1);
    }

    console.assert(input.match(/^\d{4}-[A-Za-z]{3}$/), "Invalid monthly report format, expected <year>-<monthSlug>");
    let [year, monthSlug] = input.split('-');
    monthSlug = monthSlug.toUpperCase();
    let monthId = Object.keys(monthSlugMap).indexOf(monthSlug);

    let reportId = filterCountry == null ? `monthly-${year}-${monthSlug}` : `monthly-${year}-${monthSlug}-${filterCountry}`;
    let monthlyRef = doc(reviewDB, "analytics", reportId);
    try {
        let snapshot = await getDoc(monthlyRef);
        if (snapshot.exists()) {
            return snapshot.data();
        }
    } catch (error) {
        console.log(error);
    }
    setLoadingStatus(
        (filterCountry == null ? '' : `[${filterCountry}] `) +
        `Monthly report for ${monthSlug} ${year} not found, generating...`
    );

    let dailyReports = [];
    let monthEnd = new Date(year, monthId + 1, 0);
    for (let i = 1; i <= monthEnd.getDate(); i++) {
        let dailyDate = date2iso(new Date(year, monthId, i));
        // the filter is globally available as a URL parameter, so it won't be ignored
        dailyReports.push(await getDailyReport(dailyDate));
    }

    let report = {
        id: reportId,
        type: "monthly",
        filter: filterCountry,
        timestamp: iso2date(input).getTime(),
        countries: [],
        users: [],
        timegraph: [],
        weekdayGraph: [],
        total: dailyReports.reduce((acc, d) => acc + d.total, 0),
    };

    report.countries = accumCountryReports(dailyReports);
    report.users = accumUserReports(dailyReports);
    report.timegraph = accumTimegraph(dailyReports);

    // weekday graph (starts from Monday)
    let monthStart = new Date(year, monthId, 1);
    report.weekdayGraph = accumDayOfWeek(dailyReports, date2iso(monthStart));
    console.log(report.weekdayGraph);

    if (date2iso(new Date()) <= monthStart) {
        setLoadingStatus(
            (filterCountry == null ? '' : `[${filterCountry}] `) +
            `Monthly report for ${monthSlug} ${year} is incomplete.`
        );
        alert(`NOTE: Monthly report for ${monthSlug} ${year} is incomplete.`);
    } else {
        try {
            await setDoc(monthlyRef, report);
            setLoadingStatus(
                (filterCountry == null ? '' : `[${filterCountry}] `) +
                `Monthly report for ${monthSlug} ${year} generated and saved`
            );
        } catch (error) {
            console.error(error);
        }
    }
    return report;
}

let getQuarterlyReport = async (input) => {
    let filterCountry = url.get('country');
    // make first letter uppercase
    if (filterCountry != null) {
        filterCountry = filterCountry.charAt(0).toUpperCase() + filterCountry.slice(1);
    }

    console.assert(input.match(/^\d{4}-Q[1234]$/), "Invalid quarterly report format, expected <year>-Q[1234]");
    let [year, quarter] = input.split('-');
    quarter = quarter.toUpperCase();
    let quarterId = Number(quarter[1]) - 1;

    let reportId = filterCountry == null ? `quarterly-${year}-${quarter}` : `quarterly-${year}-${quarter}-${filterCountry}`;
    let quarterlyRef = doc(reviewDB, "analytics", reportId);
    try {
        let snapshot = await getDoc(quarterlyRef);
        if (snapshot.exists()) {
            return snapshot.data();
        }
    } catch (error) {
        console.log(error);
    }
    setLoadingStatus(
        (filterCountry == null ? '' : `[${filterCountry}] `) +
        `Quarterly report for ${quarter} ${year} not found, generating...`
    );

    let monthSlugs = [
        ['JAN', 'FEB', 'MAR'],
        ['APR', 'MAY', 'JUN'],
        ['JUL', 'AUG', 'SEP'],
        ['OCT', 'NOV', 'DEC']
    ][quarterId];
    let monthlyReports = [
        await getMonthlyReport(`${year}-${monthSlugs[0]}`),
        await getMonthlyReport(`${year}-${monthSlugs[1]}`),
        await getMonthlyReport(`${year}-${monthSlugs[2]}`),
    ];

    let report = {
        id: reportId,
        type: "quarterly",
        filter: filterCountry,
        timestamp: iso2date(input).getTime(),
        countries: [],
        users: [],
        timegraph: [],
        weekdayGraph: [],
        total: monthlyReports.reduce((acc, d) => acc + d.total, 0),
    };

    report.countries = accumCountryReports(monthlyReports);
    report.users = accumUserReports(monthlyReports);
    report.timegraph = accumTimegraph(monthlyReports);
    report.weekdayGraph = accumDayOfWeek2(monthlyReports);

    let monthStart = new Date(year, quarterId * 3, 1);
    if (date2iso(new Date()) <= monthStart) {
        setLoadingStatus(
            (filterCountry == null ? '' : `[${filterCountry}] `) +
            `Quarterly report for ${quarter} ${year} is incomplete.`
        );
        alert(`NOTE: Quarterly report for ${quarter} ${year} is incomplete.`);
    } else {
        try {
            await setDoc(quarterlyRef, report);
            setLoadingStatus(
                (filterCountry == null ? '' : `[${filterCountry}] `) +
                `Quarterly report for ${quarter} ${year} generated and saved`
            );
        } catch (error) {
            console.error(error);
        }
    }
    return report;
}

// --- charts

let getCountryChart = (bestFirst = true, showOnlyTen = true) => {
    let data = window.currentReport.countries.map(c => c.count);
    data = showOnlyTen ? data.slice(0, 10) : data;
    data = bestFirst ? data : data.reverse();
    let labels = window.currentReport.countries.map(c => c.country);
    labels = showOnlyTen ? labels.slice(0, 10) : labels;
    labels = bestFirst ? labels : labels.reverse();
    return {
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
            },
            // make the bars clickable to filter by country
            onClick: (_event, elements) => {
                if (elements.length > 0) {
                    let country = labels[elements[0].index];
                    let date = url.get('date') || date2iso(new Date());
                    window.location.href = `?date=${date}&country=${country}`;
                }
            },
        }
    };
};

let getCityChart = (country, bestFirst = true, showOnlyTen = true) => {
    let data = window.currentReport.countries
        .filter(c => c.country == country)
        .flatMap(c => c.cities.map(city => city.count));
    data = showOnlyTen ? data.slice(0, 10) : data;
    data = bestFirst ? data : data.reverse();
    let labels = window.currentReport.countries
        .filter(c => c.country == country)
        .flatMap(c => c.cities.map(city => city.city));
    labels = showOnlyTen ? labels.slice(0, 10) : labels;
    labels = bestFirst ? labels : labels.reverse();
    return {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: `Memory Count by City in ${country}`,
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
    };
};

let reviewsCache = {};
let getUsersChart = (bestFirst = true, showOnlyTen = true) => {
    let data = window.currentReport.users.map(u => u.count);
    data = showOnlyTen ? data.slice(0, 10) : data;
    data = bestFirst ? data : data.reverse();
    let userIds = window.currentReport.users.map(u => u.user);
    userIds = showOnlyTen ? userIds.slice(0, 10) : userIds;
    userIds = bestFirst ? userIds : userIds.reverse();

    return {
        type: 'bar',
        data: {
            labels: userIds.map(u => fm(u)),
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
            },
            // make the bars clickable to user's profile
            onClick: (_event, elements) => {
                if (elements.length > 0) {
                    let userId = userIds[elements[0].index];
                    window.open(`https://explorer.futurememory.app/user/${userId}`, '_blank').focus();
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            let userId = window.currentReport.users.map(u => u.user)[context.dataIndex];
                            if (reviewsCache[userId] == null) {
                                getMemoriesSinceLastReview(userId).then(count => {
                                    reviewsCache[userId] = count == null ? 'none' : count;
                                    context.chart.tooltip.update(); // Trigger tooltip redraw
                                });
                                return `${context.dataset.label}: ${context.raw} (Loading...)`;
                            }
                            let msg = reviewsCache[userId] == 'none' ? 'No review' : `${reviewsCache[userId]} memories since last review`;
                            return `${context.dataset.label}: ${context.raw} (${msg})`;
                        }
                    }
                }
            }
        },
    };
};

let getActivityChart = () => {
    let labels = window.currentReport.timegraph.map(t => t.i);
    let data = window.currentReport.timegraph.map(t => t.count);
    return {
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
    };
};

let getWeekdayChart = () => {
    let labels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    let data = window.currentReport.weekdayGraph.map(t => t.count);
    return {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Memory Count by Weekday',
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
    };
}

let urlDate = url.get('date') || date2iso(new Date());
let [reportType, reportDate] = [getReportType(urlDate), getReportStartDate(urlDate)];
if (reportType == null || reportDate == null) {
    alert(`Invalid date format: ${urlDate}`);
    throw new Error(`Invalid date format: ${urlDate}`);
}

// fetch the report
window.currentReport = null;
switch (reportType) {
    case 'daily': window.currentReport = await getDailyReport(urlDate); break;
    case 'weekly': window.currentReport = await getWeeklyReport(urlDate); break;
    case 'monthly': window.currentReport = await getMonthlyReport(urlDate); break;
    case 'quarterly': window.currentReport = await getQuarterlyReport(urlDate); break;
    default: alert(`Report type ${reportType} not supported`); break;
}

// fallthrough switch
let drawCharts = (reportType) => {
    switch (reportType) {
        case 'quarterly':
            // TODO: per-month timegraph ?
        case 'monthly':
            // TODO: per-day timegraph - accumulate if quarterly
        case 'weekly':
            new Chart($('section#weekday > canvas'), getWeekdayChart());
        case 'daily':
            new Chart($('section#users-top > canvas'), getUsersChart(true, url.get('country') == null));
            new Chart($('section#activity > canvas'), getActivityChart()); // accumulate if weekly/monthly/quarterly
            if (url.get('country') != null) {
                new Chart($('section#cities-top > canvas'), getCityChart(url.get('country'), true));
            } else {
                new Chart($('section#users-bottom > canvas'), getUsersChart(false));
                new Chart($('section#countries-top > canvas'), getCountryChart(true));
                new Chart($('section#countries-bottom > canvas'), getCountryChart(false));
            }
            break;
    }
};

// used for UI display only
let getInclusiveRange = (reportDate, reportType) => {
    switch (reportType) {
        case 'daily': return [`${reportDate} 00:00:00`, `${reportDate} 23:59:59`];
        case 'weekly':
            let weekEnd = new Date(iso2date(reportDate).getTime() + 7 * 24 * 60 * 60 * 1000);
            return [`${reportDate} 00:00:00`, `${date2iso(weekEnd)} 23:59:59`];
        case 'monthly':
            // https://stackoverflow.com/questions/222309/calculate-last-day-of-month
            let monthStart = iso2date(reportDate);
            let monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
            return [`${date2iso(monthStart)} 00:00:00`, `${date2iso(monthEnd)} 23:59:59`];
        case 'quarterly':
            let quarterStart = iso2date(reportDate);
            let quarterEnd = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 0);
            return [`${date2iso(quarterStart)} 00:00:00`, `${date2iso(quarterEnd)} 23:59:59`];
    }
}
window.getInclusiveRange = getInclusiveRange;
window.getReportStartDate = getReportStartDate;

let tests = () => {
    console.assert(date2iso(new Date(2024, 10, 5)) === '2024-11-05', 'date2iso failed');
    console.assert(iso2date('2024-11-05').getTime() === new Date(2024, 10, 5).getTime(), 'iso2date failed');
    console.assert(date2iso(iso2date('2024-11-05')) === '2024-11-05', 'date2iso -> iso2date failed');
    console.assert(date2iso(iso2date('2024-02-30')) === '2024-03-01', 'date2iso -> iso2date failed (2)');
    console.assert(getTimeZoneDiff("Spain") === 1, 'getTimeZoneDiff failed');
    console.assert(getTimeZoneDiff("United States") === -8, 'getTimeZoneDiff failed (2)');
    console.assert(getInclusiveRange('2024-11-05', 'daily')[0] === '2024-11-05 00:00:00', 'getInclusiveRange daily .start failed');
    console.assert(getInclusiveRange('2024-11-05', 'daily')[1] === '2024-11-05 23:59:59', 'getInclusiveRange daily .end failed');
    console.assert(getInclusiveRange('2024-01-01', 'weekly')[0] === '2024-01-01 00:00:00', 'getInclusiveRange weekly .start failed');
    console.assert(getInclusiveRange('2024-01-01', 'weekly')[1] === '2024-01-08 23:59:59', 'getInclusiveRange weekly .end failed');
    console.assert(getInclusiveRange('2024-03-01', 'monthly')[0] === '2024-03-01 00:00:00', 'getInclusiveRange monthly .start failed');
    console.assert(getInclusiveRange('2024-03-01', 'monthly')[1] === '2024-03-31 23:59:59', 'getInclusiveRange monthly .end failed');
    console.assert(getInclusiveRange('2024-02-01', 'monthly')[1] === '2024-02-29 23:59:59', 'getInclusiveRange monthly .end failed (2)');
    console.assert(getInclusiveRange('2024-12-01', 'monthly')[1] === '2024-12-31 23:59:59', 'getInclusiveRange monthly .end failed (3)');
    console.assert(getInclusiveRange('2024-01-01', 'quarterly')[0] === '2024-01-01 00:00:00', 'getInclusiveRange quarterly .start failed');
    console.assert(getInclusiveRange('2024-01-01', 'quarterly')[1] === '2024-03-31 23:59:59', 'getInclusiveRange quarterly .end failed');
    console.assert(getInclusiveRange('2024-04-01', 'quarterly')[1] === '2024-06-30 23:59:59', 'getInclusiveRange quarterly .end failed');
    console.assert(getReportType('2024-11-05') === 'daily', 'getReportType daily failed');
    console.assert(getReportType('week-2024-11-05') === 'weekly', 'getReportType weekly failed');
    console.assert(getReportType('2024-feb') === 'monthly', 'getReportType monthly failed');
    console.assert(getReportType('2024-Q1') === 'quarterly', 'getReportType quarterly failed');
    console.assert(getReportStartDate('2024-11-05') === '2024-11-05', 'getReportStartDate daily failed');
    console.assert(getReportStartDate('week-2024-11-05') === '2024-11-05', 'getReportStartDate weekly failed');
    console.assert(getReportStartDate('2024-feb') === '2024-02-01', 'getReportStartDate monthly failed');
    console.assert(getReportStartDate('2024-Q2') === '2024-04-01', 'getReportStartDate quarterly failed');
};
tests();

let onLoad = () => {
    // remove loader & style overrides
    $('body').style = '';
    $('#loading').remove();
    $('main').style = '';

    // hide weekday reports
    switch(reportType) {
        case 'daily':
            $('section#weekday').remove();
        default:
            if (url.get('country') != null) {
                $('section#countries-top').remove()
                $('section#countries-bottom').remove()
                $('section#users-bottom').remove()
            } else {
                $('section#cities-top').remove();
            }
            break;
    }

    drawCharts(reportType);

    // set the title
    switch (reportType) {
        case 'daily': $('h2.title > span:first-child').innerText = `Daily report for ${reportDate}`; break;
        case 'weekly': $('h2.title > span:first-child').innerText = `Weekly report for ${reportDate}`; break;
        case 'monthly':
            let [year, monthSlug] = urlDate.split('-');
            let month = {
                'jan': 'January', 'feb': 'February', 'mar': 'March', 'apr': 'April',
                'may': 'May', 'jun': 'June', 'jul': 'July', 'aug': 'August',
                'sep': 'September', 'oct': 'October', 'nov': 'November', 'dec': 'December',
            }[monthSlug];
            $('h2.title > span:first-child').innerText = `Monthly report for ${month} ${year}`;
            break;
        case 'quarterly':
            let [qYear, quarter] = urlDate.split('-');
            $('h2.title > span:first-child').innerText = `${quarter.toUpperCase()} report for ${qYear}`;
            break;
    }
    let [rangeStart, rangeEnd] = getInclusiveRange(reportDate, reportType);
    $('h2.title + p').innerText = `Includes all memories from ${rangeStart} to ${rangeEnd} UTC`;
    // modify title if country filter is applied
    if (url.get('country') != null) {
        $('h2.title select').value = url.get('country');
        $('h2.title + p').innerText += ` captured in ${url.get('country')}`;
    }
    $('h2.title + p').innerText += ` (${window.currentReport.total} total memories)`;

    // set `selected` values in input
    switch (reportType) {
        case 'daily':
            $('form#datePicker > input[type="date"]').value = reportDate;
            break;
        case 'weekly':
            $('form#datePicker > input[type="date"]').value = reportDate;
            $('form#datePicker > input[type="checkbox"]').checked = true;
            break;
        case 'monthly':
            let [year, monthSlug] = urlDate.split('-');
            $('form#monthPicker > select#m-year').value = year;
            $('form#monthPicker > select#m-month').value = monthSlug;
            break;
        case 'quarterly':
            let [qYear, quarter] = urlDate.split('-');
            $('form#quarterPicker > select#q-year').value = qYear;
            $('form#quarterPicker > select#q-quarter').value = quarter;
            break;
    }

    // TODO: check the value of the country filter
    $('form#datePicker > button[type="submit"]').addEventListener('click', (e) => {
        e.preventDefault();
        let date = $('form#datePicker > input[type="date"]').value;
        let isWeekly = $('form#datePicker > input[type="checkbox"]').checked;
        date = date == '' ? date2iso(new Date()) : date; // default to today
        date = isWeekly ? `week-${date}` : date;

        let country = $('h2.title select').value;
        let hasSelectedCountry = country != 'global' && country != null && country != '';
        window.location.href = hasSelectedCountry ? `?date=${date}&country=${country}`: `?date=${date}`;
    });
    $('form#monthPicker > button[type="submit"]').addEventListener('click', (e) => {
        e.preventDefault();
        let year = $('form#monthPicker > select#m-year').value;
        let month = $('form#monthPicker > select#m-month').value;

        let country = $('h2.title select').value;
        let hasSelectedCountry = country != 'global' && country != null && country != '';
        window.location.href = hasSelectedCountry ? `?date=${year}-${month}&country=${country}`: `?date=${year}-${month}`;
    });
    $('form#quarterPicker > button[type="submit"]').addEventListener('click', (e) => {
        e.preventDefault();
        let year = $('form#quarterPicker > select#q-year').value;
        let quarter = $('form#quarterPicker > select#q-quarter').value;
        console.log(year, quarter);

        let country = $('h2.title select').value;
        let hasSelectedCountry = country != 'global' && country != null && country != '';
        window.location.href = hasSelectedCountry ? `?date=${year}-${quarter}&country=${country}` : `?date=${year}-${quarter}`;
    });

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
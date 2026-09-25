// ==UserScript==
// @name MAM Expiring VIP Util
// @namespace    Humdinger
// @author       Humdinger
// @description  Remove all non-ExpiringVIP torrents from the browse list and make dates visible
// @match        https://www.myanonamouse.net/tor/browse.php*
// @match        https://www.myanonamouse.net/tor/search.php*
// @version      0.1.0
// @icon https://cdn.myanonamouse.net/imagebucket/204586/MouseyIcon.png
// @homepage     https://www.myanonamouse.net
// @license      MIT
// @downloadURL https://github.com/TheRealHumdinger/MAM-Expiring-VIP-Util/raw/main/MAMExpiringVIPUtil.user.js
// @updateURL https://github.com/TheRealHumdinger/MAM-Expiring-VIP-Util/raw/main/MAMExpiringVIPUtil.user.js
// ==/UserScript==
(function () {
	"use strict";

	const DEBUG = 1; // Debugging mode on (1) or off (0)
	if (DEBUG > 0) console.log("Starting Expiring VIP Util");

	var otherStyle = "padding: 2px 8px; height: fit-content; border: 1px solid rgb(64, 169, 191); background-color: rgb(16, 42, 48); color: rgb(159, 212, 223); border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.9em; transition: background-color 0.2s;float:left";
	var buttonStyle = "margin: 0 10px 0 10px; " + otherStyle;
	var expLabelDarkStyle = "color: #ff4d4d;font-weight: bold;text-shadow:0 0 5px #ff1a1a,0 0 10px #ff1a1a,0 0 20px #ff3333,0 0 40px #ff3333,0 0 80px #ff0000;";
	var expLabelLightStyle = "color: #333333;font-weight: bold;text-shadow:0 0 5px #ff1a1a,0 0 10px #ff1a1a,0 0 20px #ff3333,0 0 40px #ff3333,0 0 80px #ff0000;";
	var sortByStyle = "padding: 5px 5px; height: fit-content; color: rgb(159, 212, 223); font-weight: bold; font-size: 0.9em; transition: background-color 0.2s;float:left";
	var expLabelStyle = "";

	if (document.head.innerHTML.includes("ICGstation_dark") == true) {
		expLabelStyle = expLabelDarkStyle;
	} else {
		expLabelStyle = expLabelLightStyle;
	}

	// Add Button and Date Pickers for removing all but Expiring VIP from browse list
	// Empty date picker doesn't filter on date, but a value chosen will filter to only matches of that date
	var onlyExpVIPButton = document.createElement("button");
	onlyExpVIPButton.textContent = "Remove all but Expiring VIP";
	// Button formatting based off formatting from yyyzzz999's Named Search buttons
	onlyExpVIPButton.style = buttonStyle;
	onlyExpVIPButton.onclick = function () {
		// Get the tdr rows
		var rows = [];
        if (window.location.pathname.includes('browse.php')) {
            rows = document.querySelector("table.newTorTable").querySelectorAll('[id^="tdr"]');
        }
        else {
            rows = document.querySelector("table.newTorTable").querySelectorAll('.torrentInfo');
        }
		// Array to store rows with their expiration data for sorting
		var rowsToSort = [];

		// Move through them from bottom to top
		for (let i = rows.length - 1; i >= 0; i--) {
			// Get the icon TD element
			const iconTd = rows[i].children[1];
			// Boolean values checking if PFL, FL, VIP or Expiring VIP
			const isPFL = iconTd.innerHTML.includes("personal freeleech");
			const isFreeleech = iconTd.innerHTML.includes("freedownload.gif");
			const isVIP = iconTd.innerHTML.includes("vip.png");
			const isExpVIP = iconTd.innerHTML.includes("vip_temp.png");

			// First check if it isn't expiring VIP and just remove it and move on
			if (!isExpVIP) {
				rows[i].remove();
			} else {
				// Now get the IMG element so we can get the expiration date from it
                var myImage = '';
                if (window.location.pathname.includes('browse.php')) {
                    myImage = iconTd.querySelector('img[src="https://cdn.myanonamouse.net/pic/vip_temp.png"]');
                } else {
                    myImage = iconTd.querySelector('img[src="https://sas.myanonamouse.net/pic/vip_temp.png"]');
                }
				var expDate = myImage.title.split(" ")[2];

				// Get the values from the date elements (comp is also start)
				const compDate = document.getElementById("expVIPDate").value;
				const endDate = document.getElementById("expVIPDateEnd").value;

				// Go through the different possible iterations of matching the date fields
				// If it falls within the filter call the addLabel function
				// If not, remove it
				var shouldKeep = false;
				if (expDate != "" && compDate != "" && endDate != "" && expDate >= compDate && expDate <= endDate) {
					addLabel(iconTd, expDate);
					shouldKeep = true;
				} else if (expDate != "" && compDate != "" && endDate == "" && expDate == compDate) {
					addLabel(iconTd, expDate);
					shouldKeep = true;
				} else if (expDate != "" && compDate == "" && endDate != "" && expDate <= endDate) {
					addLabel(iconTd, expDate);
					shouldKeep = true;
				} else if (expDate != "" && compDate == "" && endDate == "") {
					addLabel(iconTd, expDate);
					shouldKeep = true;
				} else {
					rows[i].remove();
				}

				// If this row should be kept, add it to the array for sorting
				if (shouldKeep) {
					var expUTCDate = createUTCTimestampFromYYYYMMDD(expDate);
					var curUTCDate = new Date();
					var daysUntilExpiry = (expUTCDate - curUTCDate) / 60 / 60 / 24 / 1000;
					if (document.getElementById("sortByDays").checked) {
						rowsToSort.push({
							row: rows[i],
							days: daysUntilExpiry,
						});
					}
				}
			}
		}

		if (document.getElementById("sortByDays").checked) {
			// Sort rows by days until expiration (soonest first)
			rowsToSort.sort(function (a, b) {
				return a.days - b.days;
			});

			// Get the table body and re-insert rows in sorted order
			var tableBody = document.querySelector("table.newTorTable").querySelector("tbody");
			for (let i = 0; i < rowsToSort.length; i++) {
				tableBody.appendChild(rowsToSort[i].row);
			}
		}
	};

	// This is the first date element for comparison of single or start date
	var expVIPDateEl = document.createElement("input");
	expVIPDateEl.type = "date";
	expVIPDateEl.id = "expVIPDate";
	expVIPDateEl.style = otherStyle;

	// This is the second date element for end date
	var expVIPDateEndEl = document.createElement("input");
	expVIPDateEndEl.type = "date";
	expVIPDateEndEl.id = "expVIPDateEnd";
	expVIPDateEndEl.style = otherStyle;

	var sortByDaysLeftEl = document.createElement("input");
	sortByDaysLeftEl.type = "checkbox";
	sortByDaysLeftEl.id = "sortByDays";
	sortByDaysLeftEl.style = "float:left";

	var sortByLabelEl = document.createElement("label");
	sortByLabelEl.type = "label";
	sortByLabelEl.textContent = "Sort?";
	sortByLabelEl.style = sortByStyle;

	// Get the blockFoot Element which is the footer for the Search Control
	const blockFootEl = document.getElementsByClassName("blockFoot")[0];
    const divSSR = document.getElementById("ssr");

	// Insert them all before the ssr div
    divSSR.before(document.createElement("br"));
	divSSR.before(onlyExpVIPButton);
	divSSR.before(expVIPDateEl);
	divSSR.before(expVIPDateEndEl);
	divSSR.before(sortByDaysLeftEl);
   	divSSR.before(sortByLabelEl);
    divSSR.before(document.createElement("br"));

/*
    // Insert them all in reverse order since I am using insertBefore
	blockFootEl.insertBefore(sortByLabelEl, blockFootEl.children[0]);
	blockFootEl.insertBefore(sortByDaysLeftEl, blockFootEl.children[0]);
	blockFootEl.insertBefore(expVIPDateEndEl, blockFootEl.children[0]);
	blockFootEl.insertBefore(expVIPDateEl, blockFootEl.children[0]);
	blockFootEl.insertBefore(onlyExpVIPButton, blockFootEl.children[0]);
*/
	// Add Label function to add both the expiration date and number of days until expiry
	function addLabel(locTd, labelStr) {
		if (locTd.querySelector("label") == null) {
			// Create label
			var expLabel = document.createElement("label");
			// Get timestamp of expiration
			var expUTCDate = createUTCTimestampFromYYYYMMDD(labelStr);
			// Get current timestamp
			var curUTCDate = new Date();

			// Add expiration date and comparison (in days) to the label
			expLabel.textContent = labelStr + "\n" + ((expUTCDate - curUTCDate) / 60 / 60 / 24 / 1000).toFixed(1) + " days";
			// Format it in a cool glowing red
			expLabel.style = expLabelStyle;
			locTd.appendChild(expLabel);
		}
	}

	// Function to take the expire date string and convert to a UTC timestamp for calculations
	function createUTCTimestampFromYYYYMMDD(dateString) {
		// Split the date string into its components
		const parts = dateString.split("-");
		const year = parseInt(parts[0], 10);
		// Month is 0-indexed in JavaScript Date objects, so subtract 1
		const month = parseInt(parts[1], 10) - 1;
		const day = parseInt(parts[2], 10);

		// Use Date.UTC to get the UTC timestamp
		const utcTimestamp = Date.UTC(year, month, day);

		return utcTimestamp;
	}
})();

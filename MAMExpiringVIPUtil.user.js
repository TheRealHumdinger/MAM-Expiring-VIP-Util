// ==UserScript==
// @name MAM Expiring VIP Util
// @namespace    Humdinger
// @author       Humdinger
// @description  Remove all non-ExpiringVIP torrents from the browse list and make dates visible
// @match        https://www.myanonamouse.net/tor/browse.php*
// @version      0.0.4
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

	// Add Button and Date Pickers for removing all but Expiring VIP from browse list
	// Empty date picker doesn't filter on date, but a value chosen will filter to only matches of that date
	var onlyExpVIPButton = document.createElement("button");
	onlyExpVIPButton.textContent = "Remove all but Expiring VIP";
	// Button formatting based off formatting from yyyzzz999's Named Search buttons
	onlyExpVIPButton.style = "margin: 0 10px 0 10px; padding: 2px 8px; height: fit-content; border: 1px solid rgb(64, 169, 191); background-color: rgb(16, 42, 48); color: rgb(159, 212, 223); border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.9em; transition: background-color 0.2s;float:left";
	onlyExpVIPButton.onclick = function () {
    // Get the tdr rows
		var rows = document.querySelector("table.newTorTable").querySelectorAll('[id^="tdr"]');
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
				var myImage = iconTd.querySelector('img[src="https://cdn.myanonamouse.net/pic/vip_temp.png"]');
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

					// Get the row ID and find matching ddr div if it exists
					var rowId = rows[i].id;
					var ddrId = rowId.replace('tdr', 'ddr');
					var ddrDiv = document.getElementById(ddrId);

					rowsToSort.push({
						row: rows[i],
						ddrDiv: ddrDiv,
						days: daysUntilExpiry
					});
				}
			}
		}

		// Sort rows by days until expiration (soonest first)
		rowsToSort.sort(function(a, b) {
			return a.days - b.days;
		});

		// Get the table body and re-insert tdr rows in sorted order
		var tableBody = document.querySelector("table.newTorTable").querySelector("tbody");
		for (let i = 0; i < rowsToSort.length; i++) {
			tableBody.appendChild(rowsToSort[i].row);
		}

		// Reorder ddr divs to match the sorted tdr rows
		// Find the parent container of the first ddr div to reorder them there
		if (rowsToSort.length > 0 && rowsToSort[0].ddrDiv) {
			var ddrParent = rowsToSort[0].ddrDiv.parentNode;
			for (let i = 0; i < rowsToSort.length; i++) {
				if (rowsToSort[i].ddrDiv) {
					ddrParent.appendChild(rowsToSort[i].ddrDiv);
				}
			}
		}
	};

  // This is the first date element for comparison of single or start date
  var expVIPDateEl = document.createElement("input");
	expVIPDateEl.type = "date";
	expVIPDateEl.id = "expVIPDate";
	expVIPDateEl.style = "padding: 2px 8px; height: fit-content; border: 1px solid rgb(64, 169, 191); background-color: rgb(16, 42, 48); color: rgb(159, 212, 223); border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.9em; transition: background-color 0.2s;float:left";

  // This is the second date element for end date
	var expVIPDateEndEl = document.createElement("input");
	expVIPDateEndEl.type = "date";
	expVIPDateEndEl.id = "expVIPDateEnd";
	expVIPDateEndEl.style = "padding: 2px 8px; height: fit-content; border: 1px solid rgb(64, 169, 191); background-color: rgb(16, 42, 48); color: rgb(159, 212, 223); border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.9em; transition: background-color 0.2s;float:left";

  // Get the blockFoot Element which is the footer for the Search Control
  const blockFootEl = document.getElementsByClassName("blockFoot")[0];

  // Insert them all in reverse order since I am using insertBefore
	blockFootEl.insertBefore(expVIPDateEndEl, blockFootEl.children[0]);
	blockFootEl.insertBefore(expVIPDateEl, blockFootEl.children[0]);
	blockFootEl.insertBefore(onlyExpVIPButton, blockFootEl.children[0]);

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
			expLabel.style = "color: #ff4d4d;font-weight: bold;text-shadow:0 0 5px #ff1a1a,0 0 10px #ff1a1a,0 0 20px #ff3333,0 0 40px #ff3333,0 0 80px #ff0000;";
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

// ==UserScript==
// @name MAM Expiring VIP Util
// @namespace    Humdinger
// @author       Humdinger
// @description  Remove all non-ExpiringVIP torrents from the browse list and make dates visible
// @match        https://www.myanonamouse.net/tor/browse.php*
// @version      0.0.1
// @icon https://cdn.myanonamouse.net/imagebucket/204586/MouseyIcon.png
// @homepage     https://www.myanonamouse.net
// @license      MIT
// @downloadURL https://github.com/TheRealHumdinger/MAM Expiring VIP Util/raw/main/MAMExpiringVIPUtil.user.js
// @updateURL https://github.com/TheRealHumdinger/MAM Expiring VIP Util/raw/main/MAMExpiringVIPUtil.user.js
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
      var rows = document.querySelector("table.newTorTable").querySelectorAll('[id^="tdr"]');
      for (let i = rows.length - 1; i >= 0; i--) {
          const iconTd = rows[i].children[1];
          const isPFL = iconTd.innerHTML.includes('personal freeleech');
          const isFreeleech = iconTd.innerHTML.includes('freedownload.gif');
          const isVIP = iconTd.innerHTML.includes('vip.png');
          const isExpVIP = iconTd.innerHTML.includes('vip_temp.png');
          if (!(isExpVIP)) {
              rows[i].remove();
          } else {
              var myImage = iconTd.querySelector('img[src="https://cdn.myanonamouse.net/pic/vip_temp.png"]');
              var expDate = myImage.title.split(" ")[2];
              const compDate = document.getElementById("expVIPDate").value;
              const endDate = document.getElementById("expVIPDateEnd").value;

              if (expDate != "" && compDate != "" && endDate != "" && expDate >= compDate && expDate <= endDate) {
                  addLabel(iconTd, expDate);
              } else if (expDate != "" && compDate != "" && endDate == "" && expDate == compDate) {
                  addLabel(iconTd, expDate);
              } else if (expDate != "" && compDate == "" && endDate != "" && expDate <= endDate) {
                  addLabel(iconTd, expDate);
              } else if (expDate != "" && compDate == "" && endDate == "") {
                  addLabel(iconTd, expDate);
              } else {
                  rows[i].remove();
              }
          }
      }
  };

  var expVIPDateEl = document.createElement("input");
  expVIPDateEl.type = "date";
  expVIPDateEl.id = "expVIPDate";
  expVIPDateEl.style = "padding: 2px 8px; height: fit-content; border: 1px solid rgb(64, 169, 191); background-color: rgb(16, 42, 48); color: rgb(159, 212, 223); border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.9em; transition: background-color 0.2s;float:left";

  var expVIPDateEndEl = document.createElement("input");
  expVIPDateEndEl.type = "date";
  expVIPDateEndEl.id = "expVIPDateEnd";
  expVIPDateEndEl.style = "padding: 2px 8px; height: fit-content; border: 1px solid rgb(64, 169, 191); background-color: rgb(16, 42, 48); color: rgb(159, 212, 223); border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.9em; transition: background-color 0.2s;float:left";
  const blockFootEl = document.getElementsByClassName("blockFoot")[0];

  blockFootEl.insertBefore(expVIPDateEndEl, blockFootEl.children[0]);
  blockFootEl.insertBefore(expVIPDateEl, blockFootEl.children[0]);
  blockFootEl.insertBefore(onlyExpVIPButton, blockFootEl.children[0]);

  function addLabel(locTd, labelStr) {
      if (locTd.querySelector('label') == null) {
          var expLabel = document.createElement("label");
          expLabel.textContent = labelStr;
          locTd.appendChild(expLabel);
      }
  }
})();

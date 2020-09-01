// Edit this if SB discount changes. Needs to be in decimal format
let gambitDiscountPercent = 0.12;

// Reload data when submit button is clicked
document.getElementById("tokenAmountForm").addEventListener("submit", reloadData);

// Pull data on page load
window.onload = function () {
    // Set default token value to 300
    document.getElementById("tokenAmount").defaultValue = 300;
    // Reload the data from API
    reloadData();
}

// ListJS options
var options = {
    // These values are assigned by adding a class, see https://listjs.com/docs/
    valueNames: ['Team1-Name',
        'Team2-Name',
        'Team1-Reward',
        'Team2-Reward',
        'Draw-Name', // Always equals "Draw"
        'Draw-Reward',
        'NoRisk-ProfitPerCard',
        'MedRisk-ProfitPerCard',
        'HighRisk-ProfitPerCard',
        'Date'
    ]
};

// Function to grab data from API
function reloadData() {
    // Show preloader
    showLoader();
    // Fetch data from API
    fetch('https://hfj9ocdja8.execute-api.eu-west-1.amazonaws.com/gambit-plays/tokens/' + document.getElementById('tokenAmount').value + '/?_limit=100&_sort=createdAt:DESC')
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            // Create HTML table
            appendData(data);
            console.log('Data successfully reloaded.');

            // Hide the preloader
            clearLoader();

            // Init ListJS
            var playList = new List('container', options);

            // Immediately sort by profitpercard, desc
            playList.sort("NoRisk-ProfitPerCard", {
                order: "desc"
            });
        })
        .catch(function (err) {
            alert('An error occurred! ' + err);
        });
}

// Function to add data from fetch() to DataTables
function appendData(data) {
    let mainContainer = document.getElementById("appendData");
    // Clear data first
    mainContainer.innerHTML = "";

    for (let i = 0; i < data.length; i++) {
        // We only want to display plays that haven't already started (i.e. past 30 min before play-time) and that are profitable
        if (moment(data[i].PlayDate).subtract(30, 'minutes').diff() > -1 && data[i].Calc.Profitable === true) {
            let card = document.createElement("div");
            // Add column sizing and margin classes
            card.className = "col-md-3 mb-3";
            // Determine which bet method options should be output
            if (data[i].Calc.NoRisk.Recommended === true && data[i].Calc.NoRisk.DrawBetAmount) {
                var noRiskWithDraw = true;
            } else if (data[i].Calc.NoRisk.Recommended === true) {
                var noRisk = true;
            } else {
                var noRisk = false;
                var noRiskWithDraw = false;
            }

            if (data[i].Calc.HighRisk.Recommended === true) {
                var highRisk = true;
                console.log("highRisk" + data[i].Team1.Name);
            } else {
                var highRisk = false;
            }

            if (data[i].Calc.MedRisk.Recommended === true) {
                var medRisk = true;
            } else {
                var medRisk = false;
            }

            // The BetAmounts / ProfitPerCard are always going to be empty, because they will be filled later with a separate function
            card.innerHTML = `
            <div class="card h-100">
                <div class="card-body">
                    <h5 class="card-title">
                    <span class="Team1-Name">${data[i].Team1.Name}</span> <small><span class="Team1-Reward">${data[i].Team1.Reward}</span></small> 
                    <br><span class="Team2-Name">${data[i].Team2.Name}</span> <small><span class="Team2-Reward">${data[i].Team2.Reward}</span></small>
                    ${data[i].Draw.Reward ? "<br><span class='Draw-Name'>Draw</span> <small><span class='Draw-Reward'>" + data[i].Draw.Reward + "</span></small>" : ""}
                    </h5>
                    <h6 class="card-subtitle mb-3 text-muted"><span class="Date">${moment(data[i].PlayDate).calendar()}</span></h6>
                    
                    <p class="card-text">
                ${noRiskWithDraw === true ?
                `
                    <span class="text-success">No Risk: </span>Bet <b>${data[i].Calc.NoRisk.Team1BetAmount}</b> tokens on ${data[i].Team1.Name}, <b>${data[i].Calc.NoRisk.Team2BetAmount}</b> tokens on ${data[i].Team2.Name}, and <b>${data[i].Calc.NoRisk.DrawBetAmount}</b> tokens on Draw.
                    <span class="badge badge-pill badge-success">${'<span class="NoRisk-ProfitPerCard">' + data[i].Calc.NoRisk.ProfitPerCard + '</span>' + '% profit ≈ ' + ((parseFloat(data[i].Calc.NoRisk.ProfitPerCard) / 100) * (parseFloat(document.getElementById("tokenAmount").value * (1 - gambitDiscountPercent)))).toFixed(2) + ' SB'}</span>
                    <hr>
                    `
                : ""}
                    
                ${noRisk === true ?
                `
                    <span class="text-success">No Risk: </span>Bet <b>${data[i].Calc.NoRisk.Team1BetAmount}</b> tokens on ${data[i].Team1.Name} and <b>${data[i].Calc.NoRisk.Team2BetAmount}</b> tokens on ${data[i].Team2.Name}.
                    <span class="badge badge-pill badge-success">${'<span class="NoRisk-ProfitPerCard">' + data[i].Calc.NoRisk.ProfitPerCard + '</span>' + '% profit ≈ ' + ((parseFloat(data[i].Calc.NoRisk.ProfitPerCard) / 100) * (parseFloat(document.getElementById("tokenAmount").value * (1 - gambitDiscountPercent)))).toFixed(2) + ' SB'}</span>
                    <hr>
                    `
                : ""}
                    
                ${medRisk === true ?
                `
                    <span class="text-warning">Med Risk: </span>Bet <b>${data[i].Calc.MedRisk.Team1BetAmount}</b> tokens on ${data[i].Calc.MedRisk.Team1ToBetOn} and <b>${data[i].Calc.MedRisk.Team2BetAmount}</b> tokens on ${data[i].Calc.MedRisk.Team2ToBetOn}.
                    <span class="badge badge-pill badge-warning">${'<span class="MedRisk-ProfitPerCard">' + data[i].Calc.MedRisk.ProfitPerCard + '</span>' + '% profit ≈ ' + ((parseFloat(data[i].Calc.MedRisk.ProfitPerCard) / 100) * (parseFloat(document.getElementById("tokenAmount").value * (1 - gambitDiscountPercent)))).toFixed(2) + ' SB'}</span>
                    <hr>
                    `
                : ""}
                
                ${highRisk === true ?
                `
                    <span class="text-danger">High Risk: </span>Bet <b>${data[i].Calc.HighRisk.BetAmount}</b> tokens on ${data[i].Calc.HighRisk.TeamToBetOn}. 
                    <span class="badge badge-pill badge-danger">${'<span class="HighRisk-ProfitPerCard">' + data[i].Calc.HighRisk.ProfitPerCard + '</span>' + '% profit ≈ ' + ((parseFloat(data[i].Calc.HighRisk.ProfitPerCard) / 100) * (parseFloat(document.getElementById("tokenAmount").value * (1 - gambitDiscountPercent)))).toFixed(2) + ' SB'}</span>
                    <hr>
                `
                : ""}
                    </p>
                    <a href="${data[i].PlayUrl}" class="card-link mt-auto" target="_blank" rel="noreferrer">Open on GambitRewards.com <i class="fas fa-external-link-alt"></i></a>
                </div>
            </div>
            `;

            // Add all the data that was just generated to the HTML content of the page
            mainContainer.appendChild(card);
        }
    }
    console.log('End of data loading function');
}

// Preloader clearer
function clearLoader() {
    $(".loader").fadeOut(500, function () {
        $(".loader").hide();
    });
}

// Preloader shower
function showLoader() {
    $(".loader").show();
}

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

// Function to grab data from API
function reloadData() {
    // Show preloader
    showLoader();
    // Remove datatables, will be reinitialized later
    destroyDataTables();
    // Fetch data from API
    fetch('https://hfj9ocdja8.execute-api.eu-west-1.amazonaws.com/gambit-plays/tokens/' + document.getElementById('tokenAmount').value + '/?_limit=100&_sort=createdAt:DESC')
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            // Create HTML table
            appendData(data);
            console.log('Data successfully reloaded.');

            // Initialize DataTables
            initDataTables();

            // Hide the preloader
            clearLoader();
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
        // We only want to display plays that haven't already started (i.e. past 1 hour before play-time) and that are profitable
        if (moment(data[i].PlayDate).subtract(1, 'hours').diff() >= 0 && data[i].Calc.Profitable === true) {
            let card = document.createElement("div");
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
                    ${data[i].Team1.Name} <small>${data[i].Team1.Reward}</small> 
                    <br>${data[i].Team2.Name} <small>${data[i].Team2.Reward}</small>
                    ${data[i].Draw.Reward ? "<br>Draw <small>" + data[i].Draw.Reward + "</small>" : ""}
                    </h5>
                    <h6 class="card-subtitle mb-3 text-muted">${moment(data[i].PlayDate).calendar()}</h6>
                    
                    <p class="card-text">
                ${noRiskWithDraw === true ?
                `
                    <span class="text-success">No Risk: </span>Bet <b>${data[i].Calc.NoRisk.Team1BetAmount}</b> tokens on ${data[i].Team1.Name}, <b>${data[i].Calc.NoRisk.Team2BetAmount}</b> tokens on ${data[i].Team2.Name}, and <b>${data[i].Calc.NoRisk.DrawBetAmount}</b> tokens on Draw.
                    <span class="badge badge-pill badge-success">${data[i].Calc.NoRisk.ProfitPerCard + '% profit ≈ ' + ((parseFloat(data[i].Calc.NoRisk.ProfitPerCard) / 100) * (parseFloat(document.getElementById("tokenAmount").value * (1 - gambitDiscountPercent)))).toFixed(2) + ' SB'}</span>
                    <hr>
                    `
                : ""}
                    
                ${noRisk === true ?
                `
                    <span class="text-success">No Risk: </span>Bet <b>${data[i].Calc.NoRisk.Team1BetAmount}</b> tokens on ${data[i].Team1.Name} and <b>${data[i].Calc.NoRisk.Team2BetAmount}</b> tokens on ${data[i].Team2.Name}.
                    <span class="badge badge-pill badge-success">${data[i].Calc.NoRisk.ProfitPerCard + '% profit ≈ ' + ((parseFloat(data[i].Calc.NoRisk.ProfitPerCard) / 100) * (parseFloat(document.getElementById("tokenAmount").value * (1 - gambitDiscountPercent)))).toFixed(2) + ' SB'}</span>
                    <hr>
                    `
                : ""}
                    
                ${medRisk === true ?
                `
                    <span class="text-warning">Med Risk: </span>Bet <b>${data[i].Calc.MedRisk.Team1BetAmount}</b> tokens on ${data[i].Calc.MedRisk.Team1ToBetOn} and <b>${data[i].Calc.MedRisk.Team2BetAmount}</b> tokens on ${data[i].Calc.MedRisk.Team2ToBetOn}.
                    <span class="badge badge-pill badge-warning">${data[i].Calc.MedRisk.ProfitPerCard + '% profit ≈ ' + ((parseFloat(data[i].Calc.MedRisk.ProfitPerCard) / 100) * (parseFloat(document.getElementById("tokenAmount").value * (1 - gambitDiscountPercent)))).toFixed(2) + ' SB'}</span>
                    <hr>
                    `
                : ""}
                
                ${highRisk === true ?
                `
                    <span class="text-danger">High Risk: </span>Bet <b>${data[i].Calc.HighRisk.BetAmount}</b> tokens on ${data[i].Calc.HighRisk.TeamToBetOn}. 
                    <span class="badge badge-pill badge-danger">${data[i].Calc.HighRisk.ProfitPerCard + '% profit ≈ ' + ((parseFloat(data[i].Calc.HighRisk.ProfitPerCard)/100) * (parseFloat(document.getElementById("tokenAmount").value * (1 - gambitDiscountPercent)))).toFixed(2) + ' SB'}</span>
                    <hr>
                `
                : ""}
                    </p>
                    <a href="${data[i].PlayUrl}" class="card-link mt-auto" target="_blank" rel="noreferrer">Open on GambitRewards.com</a>
                </div>
            </div>
            `;

            // Add all the data that was just generated to the HTML content of the page
            mainContainer.appendChild(card);
        }
    }
    console.log('End of data loading function');
}

// Function to initialize DataTables
function initDataTables() {
    $('#dataTable').DataTable({
        dom: "Bfrtipl",
        buttons: [
            'colvis'
        ],
        responsive: true,
        // Order by the Profit per card column, descending
        order: [[4, "desc"]],
        // Disallow sorting by bet amount & bet method columns
        "columnDefs": [
            {"orderable": false, "targets": [2, 3]}
        ],
        fixedHeader: true,
        autoWidth: true
    });
}

// Function to destroy DataTables
function destroyDataTables() {
    $('#dataTable').DataTable().destroy();
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

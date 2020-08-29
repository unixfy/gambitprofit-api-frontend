// Edit this if SB discount changes. Needs to be in decimal format
let gambitDiscountPercent = 0.12;

// Reload data when submit button is clicked
document.getElementById("tokenAmountForm").addEventListener("submit", reloadData);

// Pull data on page load
window.onload = function() {
    // Set default token value to 300
    document.getElementById("tokenAmount").defaultValue = 300;
    reloadData();
}

// Function to edit Bet Amounts, Profit per Card column
function betMethodSwitcher(data, i) {
    // Logic to generate the bet amounts and stuff based on the recommended play
    if ($("#betMethodSelector" + i + " option:selected").text() == "HighRisk") {
        var BetAmounts = `
                    Bet <b>${data[i].Calc.HighRisk.BetAmount}</b> tokens on ${data[i].Calc.HighRisk.TeamToBetOn}
                    `
        var ProfitPerCard = data[i].Calc.HighRisk.ProfitPerCard + '% ≈ ' + ((parseFloat(data[i].Calc.HighRisk.ProfitPerCard)/100) * (parseFloat(document.getElementById("tokenAmount").value * (1 - gambitDiscountPercent)))).toFixed(2) + ' SB';
    } else if ($("#betMethodSelector" + i + " option:selected").text() == "MedRisk" ) {
        var BetAmounts = `
                    Bet <b>${data[i].Calc.MedRisk.Team1BetAmount}</b> tokens on ${data[i].Calc.MedRisk.Team1ToBetOn}
                    and
                    <b>${data[i].Calc.MedRisk.Team2BetAmount}</b> tokens on ${data[i].Calc.MedRisk.Team2ToBetOn}
                    `
        var ProfitPerCard = data[i].Calc.MedRisk.ProfitPerCard + '% ≈ ' + ((parseFloat(data[i].Calc.MedRisk.ProfitPerCard)/100) * (parseFloat(document.getElementById("tokenAmount").value * (1 - gambitDiscountPercent)))).toFixed(2) + ' SB';
    } else if ($("#betMethodSelector" + i + " option:selected").text() == "NoRisk") {
        // Need more logic to display different strings depending if there is a draw condition
        if (data[i].Calc.NoRisk.DrawBetAmount) {
            var BetAmounts = `
                        Bet <b>${data[i].Calc.NoRisk.Team1BetAmount}</b> tokens on ${data[i].Team1.Name},
                        <b>${data[i].Calc.NoRisk.Team2BetAmount}</b> tokens on ${data[i].Team2.Name},
                        and <b>${data[i].Calc.NoRisk.DrawBetAmount}</b> tokens on Draw
                        `
        } else {
            var BetAmounts = `    
                        Bet <b>${data[i].Calc.NoRisk.Team1BetAmount}</b> tokens on ${data[i].Team1.Name}
                        and <b>${data[i].Calc.NoRisk.Team2BetAmount}</b> tokens on ${data[i].Team2.Name}
                        `
        }
        var ProfitPerCard = data[i].Calc.NoRisk.ProfitPerCard + '% ≈ ' + ((parseFloat(data[i].Calc.NoRisk.ProfitPerCard)/100) * (parseFloat(document.getElementById("tokenAmount").value * (1 - gambitDiscountPercent)))).toFixed(2) + ' SB';
    } else {
        var BetAmounts = "err";
        var ProfitPerCard = "err";
    }

    return {
        "BetAmounts": BetAmounts,
        "ProfitPerCard": ProfitPerCard
    };
}
// Function to grab data
function reloadData() {
    showLoader();
    destroyDataTables();
    fetch('https://api.gambitprofit.com/gambit-plays/tokens/' + document.getElementById('tokenAmount').value + '/?_limit=100&_sort=createdAt:DESC')
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            appendData(data);
            console.log('Data successfully reloaded.');
            initDataTables();
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
            let tr = document.createElement("tr");
            //TODO: Replace "undefined" Draw reward with a blank string
            // The BetAmounts / ProfitPerCard are always going to be empty, because they will be filled later
            tr.innerHTML = `
                <td>${data[i].Team1.Name}</td>
                <td>${data[i].Team1.Reward}</td>
                <td>${data[i].Team2.Name}</td>
                <td>${data[i].Team2.Reward}</td>
                <td>${data[i].Draw.Reward}</td>
                <td data-order="${data[i].PlayDate}">${moment(data[i].PlayDate).calendar()}</td>
                <td>
                      <select style="width: auto;" class="form-control" id="${"betMethodSelector" + i}">
                            <option selected>NoRisk</option>
                            <option>MedRisk</option>
                            <option>HighRisk</option>
                      </select>
                </td>
                <td>Empty</td>
                <td>Empty</td>
                <td><a target="_blank" class="btn btn-primary btn-block" href=${data[i].PlayUrl}>Go</a></td>     
                           `;
            mainContainer.appendChild(tr);

            // Listener to update table when bet method dropdown is switched
            $(document.body).on("change", "#betMethodSelector" + i, function(){
                // The function will return an array containing the BetAmounts and ProfitPerCard values.
                let switcherData = betMethodSwitcher(data, i);
                // Update bet amounts column of row that contains the dropdown which was updated
                $('#dataTable').DataTable().cell($(this).closest('tr'), 7).data(switcherData["BetAmounts"]);
                // Update profit per card column of row that contains the dropdown which was updated
                $('#dataTable').DataTable().cell($(this).closest('tr'), 8).data(switcherData["ProfitPerCard"]);
            });
        }
    }
    console.log('End of data loading function');
}

// Initialize DataTables
function initDataTables(){
    $('#dataTable').DataTable( {
        dom: "Bfrtipl",
        buttons: [
            'colvis'
        ],
        responsive: true,
        // Order by the date column, ascending.
        order: [[ 8, "desc" ]],
        // Disallow sorting by bet amount column
        "columnDefs": [
            { "orderable": false, "targets": [6, 7] },
        ],
        fixedHeader: true,
        autoWidth: true
    });
}

// Destroy DataTables
function destroyDataTables() {
    $('#dataTable').DataTable().destroy();
}
// Preloader clearer
function clearLoader(){
    $( ".loader" ).fadeOut(500, function() {
        $( ".loader" ).hide();
    });
}

// Preloader shower
function showLoader(){
    $( ".loader" ).show();
}

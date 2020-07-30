# gambitprofit-api-frontend
Frontend HTML files for GambitProfit.com API (api.gambitprofit.com/gambit-plays)

## index.html

Index.html displays all of the data pulled from the API as long as it meets two conditions:

a) The play is not expired (MomentJS automatically calculates this, all plays within or past 1 hour before their playtime will be hidden)

b) The play is profitable (which is calculated on the API side, setting boolean Calc.Profitable=True)

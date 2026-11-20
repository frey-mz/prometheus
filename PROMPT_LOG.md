PROMPT 1
document this api (queries a public stock api with a stock symbol) in terms of how to call it and its response shape, example: curl "https://query1.finance.yahoo.com/v8/finance/chart/TSLA?
interval=15m" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)
AppleWebKit/537.36"

Justification: Looking to just define inputs and outputs for this api, which will be useful to achieve the end goal.

Followup: I ran the curl myself and the ai documentation conformed to the shape that I saw.

PROMPT 2
create a server action, that given a stock symbol, queries intraday data from the last month, groups results by day, and returns JSON in this format and precision: [
2 {
3 "day": "2009-01-30",
4 "lowAverage": 40.2958,
5 "highAverage": 49.7534,
6 "volume": 49073348
7 }, ...other days
8 ]

then, make a frontend that uses this action with a ui that takes in a stock ticker, and then displays the raw JSON (query with interval=1d and range=1mo)

Justification: Looking to make a simple test query I can compare to the yahoo finance ui on the official yahoo site.

Followup: I noticed that the actual "groupStockData" function was a little "overengineered" as in theory the daily interval will not produce duplicate days (it was making a map assuming that the interval may produce duplicate days), so I edit the logic to be simpler but throw an error if the api returns an unexpected response. Additionally it had its functionality in a seperate file to the action, which I think doesn't make sense as its functionality hinges on a daily interval which would mean the logic would be disjoint from that context!

PROMPT 3
the groupStockData function can be merged into actions.ts (which can be put in an actions folder renamed to stockActions). additionally i believe its current implementation is too complex, as the 1 day interval should guarentee no duplicates days, so simplify the logic (should be able to do in 1 for loop that loops thru all the arrays) and throw if a dupe day is detected

Justification: Fixing the above task

Followup: LGTM

PROMPT 3
change the server action to instead get an interval of time (frontend calculates last month) this is so unit testing can be done

Justification: for testing, I will use a browser emulator to take a look at the live view of yahoo finance's website and compare numbers

Followup: LGTM, it uses the docs that it wrote correctly.

PROMPT 4
write unit testing that compares the results of the server action with parsed results of the webpage: example: curl "https://finance.yahoo.com/quote/TSLA/history/?period1=1794780729&period2=1795211597" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"

Justification: for testing, we can compare offline and online tests against the actual webpage

Followup: LGTM
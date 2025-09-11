

function test1() {
    const nowUTC = new Date();
    console.log("\n\nfromDate:", nowUTC);

    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0'); // Month is 0-based
    const day = String(now.getUTCDate()).padStart(2, '0');
    const endOfDayUTC = `${year}-${month}-${day}T23:59:59Z`;
    console.log("toDate:", endOfDayUTC);
}

function test2() {

    const nowUTC = new Date(); // ✅ current time in UTC

    const year = nowUTC.getUTCFullYear();
    const month = String(nowUTC.getUTCMonth() + 1).padStart(2, '0');
    const day = String(nowUTC.getUTCDate()).padStart(2, '0');
    // ✅ Use nowUTC as the startDate
    const startDate = nowUTC;

    // ✅ End of the same UTC day
    const endDate = new Date(`${year}-${month}-${day}T23:59:59.999Z`);

    console.log("\n\nfromDate:", startDate)
    console.log("toDate:", endDate)
}

function test3() {
    const today = new Date();
    // Set fromDate to today with current time in UTC
    const fromDate = new Date(today.toISOString());

    // Set toDate to today with 23:59:59.999 in UTC
    const toDate = new Date(today);

    toDate.setHours(23, 59, 59, 999); // Set time to 23:59:59.999
    const toDateIso = new Date(toDate.toISOString());
    console.log("\n\nfromDate:", fromDate);

    console.log("toDate:", toDateIso);
    console.log("\n\n");
}

test1()
test2()

test3()
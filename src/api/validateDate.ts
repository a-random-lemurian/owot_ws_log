export function validateDate(yearRaw: string, monthRaw: string, dayRaw: string): {
    hasError: boolean,
    statusCode: number,
    date: Date | null
    error: {
        id: string,
        error: string
    } | null
} {
    const year = parseInt(yearRaw)
    const month = parseInt(monthRaw)
    const day = parseInt(dayRaw)

    if ([year, month, day].includes(NaN)) {
        return {
            hasError: true,
            statusCode: 400,
            date: null,
            error: { error: "use numeric dates", id: "non-numeric-dates" }
        }
    }

    if (month > 12) {
        return {
            hasError: true,
            statusCode: 400,
            date: null,
            error: { error: "month is higher than 12, what calendar are you using?", id: "month-higher-than-12" }
        }
    }

    function isLeapYear(year: number): boolean {
        return (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0));
    }
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (month === 2 && isLeapYear(year)) {
        daysInMonth[1] = 29;
    }

    /* Easter egg messages */
    if (!(day > 0 && day <= daysInMonth[month - 1])) {
        return {
            hasError: true,
            statusCode: 400,
            date: null,
            error: { error: "there aren't that many days in that month", id: "invalid-day" }
        }
    }
    if (year < 1900) {
        return {
            hasError: true,
            statusCode: 400,
            date: null,
            error: { error: "do you really think they used OWOT back in ancient times?", id: "invalid-year" }
        }
    }
    if (year > new Date().getFullYear() + 100) {
        return {
            hasError: true,
            statusCode: 400,
            date: null,
            error: { error: "do you really think OWOT will last that far into the future?", id: "invalid-year" }
        }
    }

    return {
        hasError: false,
        statusCode: 200,
        date: new Date(year,month-1,day+1),
        error: null
    }
}

export default class DateStringUtils {

    public static readonly REGEX_TIMEZONE_OFFSET = /[-+]\d\d:\d\d$/;

    public static isDate(date: string): boolean {
        if (date) {
            try {
                new Date(date).toString();
                return true;
            } catch (e) {
                return false;
            }
        }
        return false;
    }

    public static format(date: string, pattern: string): string {
        if (!this.isDate(date)) {
            throw TypeError('Invalid date argument');
        }
        const asDate = new Date(date);

        pattern = this.formatPart(pattern, 'yyyy', asDate.getFullYear());
        pattern = this.formatPart(pattern, 'MM', asDate.getMonth());
        pattern = this.formatPart(pattern, 'M', asDate.getMonth());
        pattern = this.formatPart(pattern, 'dd', asDate.getDay());
        pattern = this.formatPart(pattern, 'd', asDate.getDay());
        pattern = this.formatPart(pattern, 'hh', asDate.getHours());
        pattern = this.formatPart(pattern, 'h', asDate.getHours());
        pattern = this.formatPart(pattern, 'mm', asDate.getMinutes());
        pattern = this.formatPart(pattern, 'm', asDate.getMinutes());
        pattern = this.formatPart(pattern, 'ss', asDate.getSeconds());
        pattern = this.formatPart(pattern, 's', asDate.getSeconds());

        return pattern;
    }

    public static formatPart(pattern: string, key: string, value: number) {
        return pattern.replace(new RegExp(`\\b${key}\\b`), value <= 9 && key.length === 2 ? `0${value}` : `${value}`);
    }

    public static getTimezoneOffsetInMinutes(date: string): number {
        if (!this.isDate(date)) {
            throw TypeError('Invalid date argument');
        }
        const matching = DateStringUtils.REGEX_TIMEZONE_OFFSET.exec(date);
        if (!matching) {
            return 0;
        }
        const splitting = matching[0].split(':');
        const hours = parseInt(splitting[0].slice(1), 10);
        const minutes = parseInt(splitting[1], 10);
        const totalMinutes = hours * 60 + minutes;

        return totalMinutes * (splitting[0][0] === '-' ? -1 : 1);
    }

    public static addMinutes(date: string, minutes: number): string {
        if (!this.isDate(date)) {
            throw TypeError('Invalid date argument');
        }
        const millis = minutes * 60000;
        const time = new Date(date).getTime();

        return new Date(time + millis).toISOString();
    }

}

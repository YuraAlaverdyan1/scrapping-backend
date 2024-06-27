import { ZillowListOptionITF } from '../api/Zillow/types';

class GlobalHelpers {
    static async waitForTimeout(timeout: number): Promise<void> {
        await new Promise<void>((resolve) => setTimeout(() => resolve(), timeout));
    }

    static divideArrayIntoParts<T>(array: T[], parts: number): T[][] {
        const chunkSize = Math.ceil(array.length / parts); // Calculate the size of each chunk
         const dividedArray: T[][] = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            const chunk = array.slice(i, i + chunkSize); // Slice the array into a chunk
            dividedArray.push(chunk);
        }
        return dividedArray;
    }

    static numberListOptionsForEachPage(zillowData: ZillowListOptionITF[]) {
        return Math.ceil(zillowData.length / 20);
    }
}

export default GlobalHelpers;
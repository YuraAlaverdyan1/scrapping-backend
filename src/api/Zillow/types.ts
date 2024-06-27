export interface FilterOptionsITF {
    beds: { min: number, max: number };
    price: { min: number, max: number };
    sf: { value: boolean };
    mf: { value: boolean };
    manu: { value: boolean };
    apa: { value: boolean };
    tow: { value: boolean };
    con: { value: boolean };
    land: { value: boolean };
}

export interface ZillowListOptionITF {
    link: string;
    title: string;
}

export interface ScrapedZillowDataITF {
    price: string | null | undefined;
    address: string | null | undefined;
    phoneNumber: string | null | undefined;
    companyElement: string | null | undefined;
}

export enum TYPE_OF_PROPERTIES {
    TYPE1,
    TYPE2,
    TYPE3
}
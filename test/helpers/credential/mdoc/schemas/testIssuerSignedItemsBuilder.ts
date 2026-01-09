export interface TestIssuerSignedItem {
  digestID: any;
  elementIdentifier: any;
  random: any;
  elementValue: any;
}

export function testIssuerSignedItemsBuilder(data: TestIssuerSignedItem[]) {
  return {
    withDefaults() {
      return data;
    },
    withOverrides(overrideItem: Partial<TestIssuerSignedItem>) {
      return data.map((defaultItem) =>
        defaultItem.elementIdentifier === overrideItem.elementIdentifier
          ? { ...defaultItem, ...overrideItem }
          : defaultItem,
      );
    },
    withMissingRequiredElement(elementIdentifier: string) {
      return data.filter(function (defaultItem) {
        return defaultItem.elementIdentifier !== elementIdentifier;
      });
    },
  };
}

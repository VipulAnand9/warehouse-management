import type { DemoUserRole } from "@workspace/api-zod";

export interface DemoAccount {
  email: string;
  name: string;
  role: DemoUserRole;
  salt: string;
  passwordHash: string;
}

// Demo-only identities. Passwords are generated once and stored as salted scrypt hashes.
export const demoAccounts: DemoAccount[] = [
  {
    email: "manager@warehouse.test",
    name: "Warehouse Manager",
    role: "warehouse_manager",
    salt: "69bdc6d988511f608c6c5868d59f27a3",
    passwordHash:
      "abc8aed58b5a95e36238c9e1797c16ffa95f7335c427436aeb375e719384c3ef6aaf4e3d80d5188a71b2cbcbc251c727f555318fb4ae3e55de73742027d09a99",
  },
  {
    email: "clerk@warehouse.test",
    name: "Inventory Clerk",
    role: "inventory_clerk",
    salt: "f2ed45501d3d9ed0ac2880136e373a72",
    passwordHash:
      "d4d6cd60d00da81fee560d7ce0657d64dba2b84d9b335287162507e9039c10a6e846e07a2e7efe89cfc4c9da5083e4e0865528e0d394414beb819fa68e17e863",
  },
  {
    email: "receiving@warehouse.test",
    name: "Receiving Staff",
    role: "receiving_staff",
    salt: "31b34cca4a392db23b5c7152d4aedf3c",
    passwordHash:
      "015a326a54b241e63c7a33c965906214792487d290d88e584dc16b835bab1785fdf52bc39faccd0df1d677cf5c0145b62c9c4f7f35d76422a6aed71f25d90dc0",
  },
  {
    email: "picking@warehouse.test",
    name: "Picking & Packing Staff",
    role: "picking_packing_staff",
    salt: "dcad03b29b5fdc8df57492b75c780d35",
    passwordHash:
      "c61eeb3482c17461f4a7239b91bb635d7402b9681fddb6093b5b292ab6f0ccf7b3e66212db86bbc0d850fcb63a0be46e8614e47854ea5f72086f58c9c2eb3550",
  },
  {
    email: "dispatch@warehouse.test",
    name: "Dispatch Staff",
    role: "dispatch_staff",
    salt: "61cf74b9092743039e112df2ac26bc65",
    passwordHash:
      "b51b746b1ff94cfff502a46935b468956deff374c6642867c596cb12b04c20401ad483011193a8dd8687f0ec4d0c7ebe7ac9e2eb5d23fd484917bd5408678063",
  },
  {
    email: "admin@warehouse.test",
    name: "System Administrator",
    role: "system_administrator",
    salt: "2dcda44fff6f06a2f815ae075ff47ed5",
    passwordHash:
      "f691305bede4c6fa48f648377084c8b31b8b0f96ffc9bfef9c865c4318ac221d14814abe4ef4b72b34bfa067e4f244756c2e8afc4e8dd3f0378fd49b3c67c6df",
  },
  {
    email: "supplier@warehouse.test",
    name: "Supplier",
    role: "supplier",
    salt: "62e9257084813ae41578052172a6d91c",
    passwordHash:
      "c15ed27d399309d6a7b86e02bfd8d6140f38ba8a929c9785658b85828bbe037dd39b0fdfe961fa50c34f92ec7a33950ea31a9828d1a9aac536ad8097c2f2f826",
  },
  {
    email: "delivery@warehouse.test",
    name: "Delivery Partner",
    role: "delivery_partner",
    salt: "c8e28be673107fdf7adb5b7c81bcac1a",
    passwordHash:
      "f678f685d430f784303f6d70b6e7b36299e27a3643d4a2871eca6fd8f682d78009d964aa749f74f78474ee5d8f207f3acb8f72d03ce741e78a26047cdc2833b9",
  },
];

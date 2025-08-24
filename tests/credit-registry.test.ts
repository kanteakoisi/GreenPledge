// credit-registry.test.ts
import { describe, expect, it, vi, beforeEach } from "vitest";

// Interfaces for type safety
interface ClarityResponse<T> {
  ok: boolean;
  value: T | number; // number for error codes
}

interface MintRecord {
  amount: number;
  recipient: string;
  metadata: string;
  timestamp: number;
}

interface ContractState {
  balances: Map<string, number>;
  minters: Map<string, boolean>;
  mintRecords: Map<number, MintRecord>;
  totalSupply: number;
  paused: boolean;
  admin: string;
  mintCounter: number;
  tokenUri?: string | null;
}

// Mock contract implementation
class CreditRegistryMock {
  private state: ContractState = {
    balances: new Map(),
    minters: new Map(),
    mintRecords: new Map(),
    totalSupply: 0,
    paused: false,
    admin: "deployer",
    mintCounter: 0,
    tokenUri: null,
  };

  private MAX_METADATA_LEN = 500;
  private ERR_UNAUTHORIZED = 100;
  private ERR_PAUSED = 101;
  private ERR_INVALID_AMOUNT = 102;
  private ERR_INVALID_RECIPIENT = 103;
  private ERR_INVALID_MINTER = 104;
  private ERR_ALREADY_REGISTERED = 105;
  private ERR_METADATA_TOO_LONG = 106;
  private ERR_INSUFFICIENT_BALANCE = 107;
  private ERR_SENDER_EQUALS_RECIPIENT = 108;

  constructor() {
    this.state.minters.set("deployer", true);
  }

  getName(): ClarityResponse<string> {
    return { ok: true, value: "CarbonCredit" };
  }

  getSymbol(): ClarityResponse<string> {
    return { ok: true, value: "CC" };
  }

  getDecimals(): ClarityResponse<number> {
    return { ok: true, value: 0 };
  }

  getTotalSupply(): ClarityResponse<number> {
    return { ok: true, value: this.state.totalSupply };
  }

  getBalance(account: string): ClarityResponse<number> {
    return { ok: true, value: this.state.balances.get(account) ?? 0 };
  }

  getTokenUri(): ClarityResponse<string | null> {
    return { ok: true, value: this.state.tokenUri ?? null };
  }

  getMintRecord(tokenId: number): ClarityResponse<MintRecord | null> {
    return { ok: true, value: this.state.mintRecords.get(tokenId) ?? null };
  }

  isMinter(account: string): ClarityResponse<boolean> {
    return { ok: true, value: this.state.minters.get(account) ?? false };
  }

  isPaused(): ClarityResponse<boolean> {
    return { ok: true, value: this.state.paused };
  }

  getAdmin(): ClarityResponse<string> {
    return { ok: true, value: this.state.admin };
  }

  getMintCount(): ClarityResponse<number> {
    return { ok: true, value: this.state.mintCounter };
  }

  setTokenUri(caller: string, newUri: string | null): ClarityResponse<boolean> {
    if (caller !== this.state.admin) {
      return { ok: false, value: this.ERR_UNAUTHORIZED };
    }
    this.state.tokenUri = newUri;
    return { ok: true, value: true };
  }

  setAdmin(caller: string, newAdmin: string): ClarityResponse<boolean> {
    if (caller !== this.state.admin) {
      return { ok: false, value: this.ERR_UNAUTHORIZED };
    }
    this.state.admin = newAdmin;
    return { ok: true, value: true };
  }

  pauseContract(caller: string): ClarityResponse<boolean> {
    if (caller !== this.state.admin) {
      return { ok: false, value: this.ERR_UNAUTHORIZED };
    }
    this.state.paused = true;
    return { ok: true, value: true };
  }

  unpauseContract(caller: string): ClarityResponse<boolean> {
    if (caller !== this.state.admin) {
      return { ok: false, value: this.ERR_UNAUTHORIZED };
    }
    this.state.paused = false;
    return { ok: true, value: true };
  }

  addMinter(caller: string, minter: string): ClarityResponse<boolean> {
    if (caller !== this.state.admin) {
      return { ok: false, value: this.ERR_UNAUTHORIZED };
    }
    if (this.state.minters.has(minter)) {
      return { ok: false, value: this.ERR_ALREADY_REGISTERED };
    }
    this.state.minters.set(minter, true);
    return { ok: true, value: true };
  }

  removeMinter(caller: string, minter: string): ClarityResponse<boolean> {
    if (caller !== this.state.admin) {
      return { ok: false, value: this.ERR_UNAUTHORIZED };
    }
    this.state.minters.set(minter, false);
    return { ok: true, value: true };
  }

  mint(caller: string, amount: number, recipient: string, metadata: string): ClarityResponse<boolean> {
    if (this.state.paused) {
      return { ok: false, value: this.ERR_PAUSED };
    }
    if (!this.state.minters.get(caller)) {
      return { ok: false, value: this.ERR_INVALID_MINTER };
    }
    if (amount <= 0) {
      return { ok: false, value: this.ERR_INVALID_AMOUNT };
    }
    if (recipient === "deployer") { // Example restriction
      return { ok: false, value: this.ERR_INVALID_RECIPIENT };
    }
    if (metadata.length > this.MAX_METADATA_LEN) {
      return { ok: false, value: this.ERR_METADATA_TOO_LONG };
    }
    const currentBalance = this.state.balances.get(recipient) ?? 0;
    this.state.balances.set(recipient, currentBalance + amount);
    this.state.totalSupply += amount;
    const tokenId = this.state.mintCounter;
    this.state.mintRecords.set(tokenId, {
      amount,
      recipient,
      metadata,
      timestamp: Date.now(),
    });
    this.state.mintCounter = tokenId + 1;
    return { ok: true, value: true };
  }

  transfer(caller: string, amount: number, sender: string, recipient: string, memo?: Buffer): ClarityResponse<boolean> {
    if (this.state.paused) {
      return { ok: false, value: this.ERR_PAUSED };
    }
    if (caller !== sender) {
      return { ok: false, value: this.ERR_UNAUTHORIZED };
    }
    if (amount <= 0) {
      return { ok: false, value: this.ERR_INVALID_AMOUNT };
    }
    if (sender === recipient) {
      return { ok: false, value: this.ERR_SENDER_EQUALS_RECIPIENT };
    }
    const senderBalance = this.state.balances.get(sender) ?? 0;
    if (senderBalance < amount) {
      return { ok: false, value: this.ERR_INSUFFICIENT_BALANCE };
    }
    this.state.balances.set(sender, senderBalance - amount);
    const recipientBalance = this.state.balances.get(recipient) ?? 0;
    this.state.balances.set(recipient, recipientBalance + amount);
    return { ok: true, value: true };
  }

  burn(caller: string, amount: number): ClarityResponse<boolean> {
    if (this.state.paused) {
      return { ok: false, value: this.ERR_PAUSED };
    }
    if (amount <= 0) {
      return { ok: false, value: this.ERR_INVALID_AMOUNT };
    }
    const senderBalance = this.state.balances.get(caller) ?? 0;
    if (senderBalance < amount) {
      return { ok: false, value: this.ERR_INSUFFICIENT_BALANCE };
    }
    this.state.balances.set(caller, senderBalance - amount);
    this.state.totalSupply -= amount;
    return { ok: true, value: true };
  }

  verifyCredit(tokenId: number, expectedRecipient: string, expectedAmount: number): ClarityResponse<boolean> {
    const record = this.state.mintRecords.get(tokenId);
    if (!record) {
      return { ok: false, value: this.ERR_UNAUTHORIZED };
    }
    if (record.recipient !== expectedRecipient || record.amount !== expectedAmount) {
      return { ok: false, value: this.ERR_INVALID_AMOUNT };
    }
    return { ok: true, value: true };
  }

  updateMetadata(caller: string, tokenId: number, newMetadata: string): ClarityResponse<boolean> {
    const record = this.state.mintRecords.get(tokenId);
    if (!record) {
      return { ok: false, value: this.ERR_UNAUTHORIZED };
    }
    if (!this.state.minters.get(caller)) {
      return { ok: false, value: this.ERR_INVALID_MINTER };
    }
    if (newMetadata.length > this.MAX_METADATA_LEN) {
      return { ok: false, value: this.ERR_METADATA_TOO_LONG };
    }
    this.state.mintRecords.set(tokenId, { ...record, metadata: newMetadata });
    return { ok: true, value: true };
  }
}

// Test setup
const accounts = {
  deployer: "deployer",
  minter: "wallet_1",
  user1: "wallet_2",
  user2: "wallet_3",
};

describe("CreditRegistry Contract", () => {
  let contract: CreditRegistryMock;

  beforeEach(() => {
    contract = new CreditRegistryMock();
    vi.resetAllMocks();
  });

  it("should initialize with correct token metadata", () => {
    expect(contract.getName()).toEqual({ ok: true, value: "CarbonCredit" });
    expect(contract.getSymbol()).toEqual({ ok: true, value: "CC" });
    expect(contract.getDecimals()).toEqual({ ok: true, value: 0 });
    expect(contract.getTotalSupply()).toEqual({ ok: true, value: 0 });
    expect(contract.getTokenUri()).toEqual({ ok: true, value: null });
  });

  it("should allow admin to set token URI", () => {
    const result = contract.setTokenUri(accounts.deployer, "https://example.com/token");
    expect(result).toEqual({ ok: true, value: true });
    expect(contract.getTokenUri()).toEqual({ ok: true, value: "https://example.com/token" });
  });

  it("should allow admin to add minter", () => {
    const addMinter = contract.addMinter(accounts.deployer, accounts.minter);
    expect(addMinter).toEqual({ ok: true, value: true });

    const isMinter = contract.isMinter(accounts.minter);
    expect(isMinter).toEqual({ ok: true, value: true });
  });

  it("should prevent non-admin from adding minter", () => {
    const addMinter = contract.addMinter(accounts.user1, accounts.user2);
    expect(addMinter).toEqual({ ok: false, value: 100 });
  });

  it("should allow minter to mint tokens with metadata", () => {
    contract.addMinter(accounts.deployer, accounts.minter);
    
    const mintResult = contract.mint(
      accounts.minter,
      1000,
      accounts.user1,
      "Captured from Project XYZ, 1000 tons CO2"
    );
    expect(mintResult).toEqual({ ok: true, value: true });
    expect(contract.getBalance(accounts.user1)).toEqual({ ok: true, value: 1000 });
    expect(contract.getTotalSupply()).toEqual({ ok: true, value: 1000 });
    expect(contract.getMintCount()).toEqual({ ok: true, value: 1 });

    const mintRecord = contract.getMintRecord(0);
    expect(mintRecord).toEqual({
      ok: true,
      value: expect.objectContaining({
        amount: 1000,
        recipient: accounts.user1,
        metadata: "Captured from Project XYZ, 1000 tons CO2",
      }),
    });
  });

  it("should prevent non-minter from minting", () => {
    const mintResult = contract.mint(
      accounts.user1,
      1000,
      accounts.user1,
      "Unauthorized mint"
    );
    expect(mintResult).toEqual({ ok: false, value: 104 });
  });

  it("should allow token transfer between users", () => {
    contract.addMinter(accounts.deployer, accounts.minter);
    contract.mint(accounts.minter, 1000, accounts.user1, "Test mint");

    const transferResult = contract.transfer(
      accounts.user1,
      500,
      accounts.user1,
      accounts.user2
    );
    expect(transferResult).toEqual({ ok: true, value: true });
    expect(contract.getBalance(accounts.user1)).toEqual({ ok: true, value: 500 });
    expect(contract.getBalance(accounts.user2)).toEqual({ ok: true, value: 500 });
  });

  it("should prevent transfer of insufficient balance", () => {
    contract.addMinter(accounts.deployer, accounts.minter);
    contract.mint(accounts.minter, 100, accounts.user1, "Test mint");

    const transferResult = contract.transfer(
      accounts.user1,
      200,
      accounts.user1,
      accounts.user2
    );
    expect(transferResult).toEqual({ ok: false, value: 107 });
  });

  it("should allow burning tokens", () => {
    contract.addMinter(accounts.deployer, accounts.minter);
    contract.mint(accounts.minter, 1000, accounts.user1, "Test mint");

    const burnResult = contract.burn(accounts.user1, 300);
    expect(burnResult).toEqual({ ok: true, value: true });
    expect(contract.getBalance(accounts.user1)).toEqual({ ok: true, value: 700 });
    expect(contract.getTotalSupply()).toEqual({ ok: true, value: 700 });
  });

  it("should pause and unpause contract", () => {
    const pauseResult = contract.pauseContract(accounts.deployer);
    expect(pauseResult).toEqual({ ok: true, value: true });
    expect(contract.isPaused()).toEqual({ ok: true, value: true });

    const mintDuringPause = contract.mint(
      accounts.deployer,
      1000,
      accounts.user1,
      "Paused mint"
    );
    expect(mintDuringPause).toEqual({ ok: false, value: 101 });

    const unpauseResult = contract.unpauseContract(accounts.deployer);
    expect(unpauseResult).toEqual({ ok: true, value: true });
    expect(contract.isPaused()).toEqual({ ok: true, value: false });
  });

  it("should prevent metadata exceeding max length", () => {
    contract.addMinter(accounts.deployer, accounts.minter);
    
    const longMetadata = "a".repeat(501);
    const mintResult = contract.mint(
      accounts.minter,
      1000,
      accounts.user1,
      longMetadata
    );
    expect(mintResult).toEqual({ ok: false, value: 106 });
  });

  it("should verify credit record", () => {
    contract.addMinter(accounts.deployer, accounts.minter);
    contract.mint(accounts.minter, 1000, accounts.user1, "Test mint");

    const verifyResult = contract.verifyCredit(0, accounts.user1, 1000);
    expect(verifyResult).toEqual({ ok: true, value: true });

    const invalidVerify = contract.verifyCredit(0, accounts.user2, 1000);
    expect(invalidVerify).toEqual({ ok: false, value: 102 });
  });

  it("should allow minter to update metadata", () => {
    contract.addMinter(accounts.deployer, accounts.minter);
    contract.mint(accounts.minter, 1000, accounts.user1, "Initial metadata");

    const updateResult = contract.updateMetadata(accounts.minter, 0, "Updated impact proof");
    expect(updateResult).toEqual({ ok: true, value: true });

    const mintRecord = contract.getMintRecord(0);
    expect(mintRecord).toEqual({
      ok: true,
      value: expect.objectContaining({
        metadata: "Updated impact proof",
      }),
    });
  });

  it("should prevent non-minter from updating metadata", () => {
    contract.addMinter(accounts.deployer, accounts.minter);
    contract.mint(accounts.minter, 1000, accounts.user1, "Initial metadata");

    const updateResult = contract.updateMetadata(accounts.user1, 0, "Unauthorized update");
    expect(updateResult).toEqual({ ok: false, value: 104 });
  });
});
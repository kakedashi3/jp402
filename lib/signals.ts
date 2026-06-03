// 信頼シグナル（透明・載る≠信頼）。MVP scaffold ではスタブ。
// 将来 P5: ALCHEMY_POLYGON_URL があれば alchemy_getAssetTransfers で
// payTo への JPYC 着金を走査し txCount / uniqueWallets / volume を算出する
// （重い sync stack でなく paylog/Alchemy 走査に置換、という jp402-scan の決定）。

export interface TrustSignals {
  txCount: number | null;
  uniqueWallets: number | null;
  measured: boolean;
}

export const UNMEASURED: TrustSignals = {
  txCount: null,
  uniqueWallets: null,
  measured: false,
};

export async function getSignals(_payTo: string): Promise<TrustSignals> {
  const url = process.env.ALCHEMY_POLYGON_URL;
  if (!url) return UNMEASURED;
  // TODO(P5): alchemy_getAssetTransfers(category=erc20, contractAddresses=[JPYC], toAddress=payTo)
  //           を desc で走査し txCount / ユニーク from 数 / volume を集計。
  return UNMEASURED;
}

import { useEffect, useState } from "react";
import { useMetaMaskStore, useGarden, useSignStore } from "./store";
import { Assets } from "@gardenfi/orderbook";

type AmountState = {
  btcAmount: string | null;
  wbtcAmount: string | null;
};

const SwapComponent: React.FC = () => {
  const [amount, setAmount] = useState<AmountState>({
    btcAmount: null,
    wbtcAmount: null,
  });

  const changeAmount = (of: "WBTC" | "BTC", value: string) => {
    if (of === "WBTC") {
      handleWBTCChange(value);
    }
  };
  const handleWBTCChange = (value: string) => {
    const newAmount: AmountState = { wbtcAmount: value, btcAmount: null };
    if (Number(value) > 0) {
      const btcAmount = (1 - 0.3 / 100) * Number(value);
      newAmount.btcAmount = btcAmount.toFixed(8).toString();
    }
    setAmount(newAmount);
  };

  return (
    <div className="swap-component">
      <WalletConnect />
      <hr></hr>
      <SwapAmount amount={amount} changeAmount={changeAmount} />
      <hr></hr>
      <Swap amount={amount} changeAmount={changeAmount} />
    </div>
  );
};

const WalletConnect: React.FC = () => {
  const { connectMetaMask, metaMaskIsConnected } = useMetaMaskStore();

  return (
    <div className="swap-component-top-section">
      <span className="swap-title">Swap</span>
      <MetaMaskButton
        isConnected={metaMaskIsConnected}
        onClick={connectMetaMask}
      />
    </div>
  );
};

type MetaMaskButtonProps = {
  isConnected: boolean;
  onClick: () => void;
};

const MetaMaskButton: React.FC<MetaMaskButtonProps> = ({
  isConnected,
  onClick,
}) => {
  const buttonClass = `connect-metamask button-${
    isConnected ? "black" : "white"
  }`;
  const buttonText = isConnected ? "Connected" : "Connect Metamask";

  return (
    <button className={buttonClass} onClick={onClick}>
      {buttonText}
    </button>
  );
};

type TransactionAmountComponentProps = {
  amount: AmountState;
  changeAmount: (of: "WBTC" | "BTC", value: string) => void;
};

const SwapAmount: React.FC<TransactionAmountComponentProps> = ({
  amount,
  changeAmount,
}) => {
  const { wbtcAmount, btcAmount } = amount;

  return (
    <div className="swap-component-middle-section">
      <InputField
        id="wbtc"
        label="Send WBTC"
        value={wbtcAmount}
        onChange={(value) => changeAmount("WBTC", value)}
      />
      <InputField id="btc" label="Receive BTC" value={btcAmount} readOnly />
    </div>
  );
};

type InputFieldProps = {
  id: string;
  label: string;
  value: string | null;
  readOnly?: boolean;
  onChange?: (value: string) => void;
};

const InputField: React.FC<InputFieldProps> = ({
  id,
  label,
  value,
  readOnly,
  onChange,
}) => (
  <div>
    <label htmlFor={id}>{label}</label>
    <div className="input-component">
      <input
        id={id}
        placeholder="0"
        value={value ? value : ""}
        type="number"
        readOnly={readOnly}
        onChange={(e) => onChange && onChange(e.target.value)}
      />
      <button>{id.toUpperCase()}</button>
    </div>
  </div>
);

type SwapAndAddressComponentProps = {
  amount: AmountState;
  changeAmount: (of: "WBTC" | "BTC", value: string) => void;
};

const Swap: React.FC<SwapAndAddressComponentProps> = ({
  amount,
  changeAmount,
}) => {
  const { garden, bitcoin } = useGarden();
  const [btcAddress, setBtcAddress] = useState<string>();
  const { metaMaskIsConnected } = useMetaMaskStore();
  const { wbtcAmount, btcAmount } = amount;

  const { isSigned } = useSignStore();

  const [isWBTCtoBTC, setIsWBTCtoBTC] = useState(true);


  useEffect(() => {
    if (!bitcoin) return;
    const getAddress = async () => {
      if (isSigned) {
        const address = await bitcoin.getAddress();
        setBtcAddress(address);
      }
    };
    getAddress();
  }, [bitcoin, isSigned]);

  const handleSwap = async () => {
    if (
      !garden ||
      typeof Number(wbtcAmount) !== "number" ||
      typeof Number(btcAmount) !== "number"
    )
      return;

    let sendAmount, receiveAmount, sendAsset, receiveAsset;

    if (isWBTCtoBTC) {
      sendAmount = Number(wbtcAmount) * 1e8;
      receiveAmount = Number(btcAmount) * 1e8;
      sendAsset = Assets.ethereum_localnet.WBTC;
      receiveAsset = Assets.bitcoin_regtest.BTC;
    } else {
      sendAmount = Number(btcAmount) * 1e8;
      receiveAmount = Number(wbtcAmount) * 1e8;
      sendAsset = Assets.bitcoin_regtest.BTC;
      receiveAsset = Assets.ethereum_localnet.WBTC;
    }

    changeAmount("WBTC", "");
    changeAmount("BTC", "");

    await garden.swap(
      sendAsset,
      receiveAsset,
      sendAmount,
      receiveAmount
    );
  };

  return (
    <div className="swap-component-bottom-section">
      <div>
        <label htmlFor="receive-address">Receive address</label>
        <div className="input-component">
          <input
            id="receive-address"
            placeholder={isWBTCtoBTC ? "Enter BTC Address" : "Enter ETH Address"}
            value={btcAddress ? btcAddress : ""}
            onChange={(e) => setBtcAddress(e.target.value)}
          />
        </div>
      </div>
      <ToggleSwitch
        isChecked={isWBTCtoBTC}
        onToggle={() => setIsWBTCtoBTC(!isWBTCtoBTC)}
        leftLabel="BTC to WBTC"
        rightLabel="WBTC to BTC"
      />
      <button
        className={`button-${metaMaskIsConnected ? "white" : "black"}`}
        onClick={handleSwap}
        disabled={!metaMaskIsConnected}
      >
        Swap
      </button>
    </div>
  );
};

// New ToggleSwitch component
type ToggleSwitchProps = {
  isChecked: boolean;
  onToggle: () => void;
  leftLabel: string;
  rightLabel: string;
};

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  isChecked,
  onToggle,
  leftLabel,
  rightLabel,
}) => {
  return (
    <div className="toggle-switch-container">
      <span className={!isChecked ? "active" : ""}>{leftLabel}</span>
      <label className="toggle-switch">
        <input type="checkbox" checked={isChecked} onChange={onToggle} />
        <span className="slider round"></span>
      </label>
      <span className={isChecked ? "active" : ""}>{rightLabel}</span>
    </div>
  );
};


export default SwapComponent;

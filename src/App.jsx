import { useMemo, useState } from "react";
import { flushSync } from "react-dom";

const assetPath = (path) => `${import.meta.env.BASE_URL}${path}`;

const ICONS = {
  back: assetPath("icons/chevron-left.svg"),
  down: assetPath("icons/angle-down.svg"),
  merchantLogo: assetPath("icons/merchant-logo.png"),
  weiqifu: assetPath("icons/weiqifu.png"),
  info: assetPath("icons/circle-info.svg"),
  weixin: assetPath("icons/weixin.svg"),
  alipay: assetPath("icons/alipay.svg"),
  card: assetPath("icons/credit-card.svg"),
};

const ONLINE_METHODS = [
  {
    key: "wechat",
    label: "微信支付",
    icon: ICONS.weixin,
    tone: "green",
  },
  {
    key: "alipay",
    label: "支付宝",
    icon: ICONS.alipay,
    tone: "blue",
  },
  {
    key: "card",
    label: "银行卡快捷",
    icon: ICONS.card,
    tone: "red",
  },
];

const ORDER_SHARED = {
  payeeName: "皮氏咖啡(上海)有限公司",
  createdAt: "2026-06-04 10:28",
  flowExpireAt: "2026-06-19 10:28",
  transferNo: "WQF20260604000189",
  tenderNo: "LP20260604009382",
  transferRemark: "WQ12345678987",
};

const PAYMENT_CASES = [
  {
    key: "payment-200",
    label: "订单 ￥1,000 / 钱包 ￥200",
    amount: 1000,
    walletBalance: 200,
    orderNo: "57372319939",
  },
  {
    key: "payment-4000",
    label: "订单 ￥1,000 / 钱包 ￥4,000",
    amount: 1000,
    walletBalance: 4000,
    orderNo: "57372319940",
  },
  {
    key: "payment-0",
    label: "订单 ￥1,000 / 钱包 ￥0",
    amount: 1000,
    walletBalance: 0,
    orderNo: "57372319941",
  },
];

const RECHARGE_CASE = {
  key: "recharge",
  scenarioType: "recharge",
  label: "企业充值",
  amount: 32000,
  walletBalance: null,
  enterpriseCustomerId: null,
  orderNo: "57372319938",
};

function formatCurrency(amount) {
  return `￥${Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function createRuntimeOrder(scenarioKey, paymentCaseKey) {
  const paymentCase =
    PAYMENT_CASES.find((item) => item.key === paymentCaseKey) ?? PAYMENT_CASES[0];
  const base =
    scenarioKey === "recharge"
      ? RECHARGE_CASE
      : {
          ...paymentCase,
          scenarioType: "payment",
          label: "企业付款",
          enterpriseCustomerId: "ENT-PEETS-001",
        };

  return {
    ...ORDER_SHARED,
    ...base,
    walletInitialBalance: base.walletBalance,
    walletAvailable: base.walletBalance ?? null,
    walletFrozen: 0,
    walletUsedAmount: 0,
    transferAmount: null,
    transferStatus: null,
    resultMethod: null,
  };
}

function getWalletUseAmount(order, walletSelected) {
  if (!order?.enterpriseCustomerId || !walletSelected || order.walletAvailable <= 0) {
    return 0;
  }

  return Math.min(order.walletAvailable, order.amount);
}

function releaseWalletFreeze(order) {
  const frozen = order.walletFrozen ?? 0;

  return {
    ...order,
    walletAvailable:
      typeof order.walletAvailable === "number" ? order.walletAvailable + frozen : null,
    walletFrozen: 0,
    walletUsedAmount: 0,
  };
}

function Icon({ src, tone = "dark", className = "" }) {
  return <img className={`icon icon-${tone} ${className}`} src={src} alt="" />;
}

function AppHeader({ onBack }) {
  return (
    <header className="topbar">
      {onBack ? (
        <button className="back-button" onClick={onBack} type="button">
          <Icon src={ICONS.back} className="back-icon" />
          返回
        </button>
      ) : null}
      <img className="brand-logo" src={ICONS.merchantLogo} alt="Peet's Coffee" />
      <button className="language-button" type="button">
        中文
        <Icon src={ICONS.down} className="down-icon" />
      </button>
    </header>
  );
}

function OrderSimulatorPage({
  selectedScenario,
  selectedPaymentCase,
  onScenarioChange,
  onPaymentCaseChange,
  onSubmit,
}) {
  const isPayment = selectedScenario === "payment";

  return (
    <>
      <AppHeader />
      <main className="simulator-shell">
        <section className="simulator-panel">
          <div className="simulator-head">
            <div>
              <h1>B2B 订单模拟下单</h1>
              <p>默认 business_type=b2b，品牌已开通企业钱包支付方式 1102。</p>
            </div>
          </div>

          <div className="simulator-section">
            <h2>下单场景</h2>
            <div className="simulator-choice-grid two">
              <button
                className={`simulator-card ${
                  selectedScenario === "recharge" ? "selected" : ""
                }`}
                data-testid="scenario-recharge"
                onClick={() => onScenarioChange("recharge")}
                type="button"
              >
                <strong>企业充值</strong>
                <span>订单金额 ￥32,000.00</span>
                <em>不传企业客户 id</em>
              </button>
              <button
                className={`simulator-card ${isPayment ? "selected" : ""}`}
                data-testid="scenario-payment"
                onClick={() => onScenarioChange("payment")}
                type="button"
              >
                <strong>企业付款</strong>
                <span>订单金额 ￥1,000.00</span>
                <em>传企业客户 id，展示企业钱包账户</em>
              </button>
            </div>
          </div>

          {isPayment ? (
            <div className="simulator-section">
              <h2>企业付款金额组合</h2>
              <div className="simulator-choice-grid three">
                {PAYMENT_CASES.map((item) => (
                  <button
                    className={`simulator-card compact ${
                      selectedPaymentCase === item.key ? "selected" : ""
                    }`}
                    data-testid={item.key}
                    key={item.key}
                    onClick={() => onPaymentCaseChange(item.key)}
                    type="button"
                  >
                    <strong>{item.label}</strong>
                    <span>企业钱包可用余额 {formatCurrency(item.walletBalance)}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="simulator-summary">
            <div>
              <span>业务类型</span>
              <strong>b2b</strong>
            </div>
            <div>
              <span>品牌企业钱包支付</span>
              <strong>已开通 1102</strong>
            </div>
            <div>
              <span>企业客户 id</span>
              <strong>{isPayment ? "ENT-PEETS-001" : "不传"}</strong>
            </div>
          </div>

          <button
            className="simulator-submit"
            data-testid="simulate-submit"
            onClick={onSubmit}
            type="button"
          >
            模拟下单
          </button>
        </section>
      </main>
    </>
  );
}

function OrderSummary({ order }) {
  return (
    <section className="order-summary">
      <div className="order-copy">
        <p className="order-title">订单提交成功，请尽快付款。</p>
        <p>
          请您在 <span className="danger">14 天 23 小时 59 分</span>{" "}
          内完成支付，否则订单将被自动关闭
        </p>
        <p>订单编号： {order.orderNo}</p>
      </div>
      <div className="amount-block">
        <span>订单金额</span>
        <strong>{formatCurrency(order.amount)}</strong>
      </div>
    </section>
  );
}

function WalletGlyph() {
  return (
    <span className="wallet-glyph" aria-hidden="true">
      ¥
    </span>
  );
}

function EnterpriseWalletSection({ order, mode, selected, onToggle }) {
  if (!order.enterpriseCustomerId) return null;

  const locked = mode === "pending";
  const available = order.walletAvailable ?? 0;
  const frozen = order.walletFrozen ?? 0;
  const unavailable = available <= 0 && frozen <= 0;
  const disabled = locked || unavailable;
  const walletUseAmount = selected
    ? frozen > 0
      ? frozen
      : Math.min(available, order.amount)
    : 0;
  const remainingAmount = Math.max(order.amount - walletUseAmount, 0);
  const showCombinationTip = mode === "idle" && walletUseAmount > 0 && remainingAmount > 0;
  const showFullWalletTip = mode === "idle" && walletUseAmount >= order.amount;

  return (
    <section className="cashier-section wallet-section">
      <div className="section-title-row">
        <h2>企业钱包账户</h2>
      </div>
      <button
        aria-disabled={disabled}
        className={`wallet-option ${selected ? "selected" : ""} ${
          locked ? "locked" : ""
        } ${
          unavailable ? "unavailable" : ""
        }`}
        data-testid="wallet-option"
        disabled={unavailable}
        onClick={onToggle}
        type="button"
      >
        <span className="option-check" />
        <WalletGlyph />
        <span className="wallet-main">
          <strong>企业钱包账户</strong>
          {unavailable ? (
            <em>无可用余额</em>
          ) : frozen > 0 ? (
            <em>可用余额：{formatCurrency(available)}</em>
          ) : (
            <em>可用余额：{formatCurrency(available)}</em>
          )}
        </span>
        {frozen > 0 ? (
          <span className="wallet-frozen-summary">
            <strong>已冻结-{formatCurrency(frozen)}</strong>
            <em>腾讯微企付支付成功后自动扣除。</em>
          </span>
        ) : walletUseAmount > 0 ? (
          <span className="wallet-used-amount">-{formatCurrency(walletUseAmount)}</span>
        ) : null}
      </button>
      {showCombinationTip ? (
        <div className="wallet-pay-tip" data-testid="wallet-combo-tip">
          请选择剩余金额支付方式
        </div>
      ) : null}
      {showFullWalletTip ? (
        <div className="wallet-pay-tip" data-testid="wallet-full-tip">
          已使用企业钱包账户全额抵扣，无需选择其他支付方式
        </div>
      ) : null}
    </section>
  );
}

function TransferOptionCard({ selectedMethod, locked, onSelect }) {
  const isSelected = selectedMethod === "transfer" && !locked;

  return (
    <button
      className={`transfer-option ${isSelected ? "selected" : ""}`}
      data-testid="transfer-option"
      disabled={locked}
      onClick={onSelect}
      type="button"
    >
      <span className="option-check" />
      <span className="option-icon bank-icon-shell">
        <Icon src={ICONS.weiqifu} tone="native" />
      </span>
      <span className="option-main">
        <span className="option-title-line">
          <strong>腾讯微企付</strong>
          <em>腾讯旗下大额转账产品</em>
        </span>
      </span>
    </button>
  );
}

function TransferFlowCard({ order, onQuery, onCancel }) {
  return (
    <div className="transfer-flow">
      <div className="flow-head">
        <div className="flow-head-main">
          <div className="flow-icon">
            <Icon src={ICONS.weiqifu} tone="native" />
          </div>
          <div>
            <div className="flow-status-line">
              <strong>腾讯微企付</strong>
              <span className="flow-badge pending">待财务转账</span>
            </div>
            <div className="flow-details">
              <p>收款方：{order.payeeName}</p>
              <p>截止时间：请在 {order.flowExpireAt} 前完成转账付款</p>
            </div>
          </div>
        </div>
        <div className="flow-head-actions">
          <button className="flow-action-button primary" onClick={onQuery} type="button">
            已转账
          </button>
          <button
            className="flow-action-button outline"
            data-testid="cancel-transfer"
            onClick={onCancel}
            type="button"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}

function PendingTransferPanel({ order, onContinue, onQuery, onCancel }) {
  const frozenAmount = order.walletFrozen ?? 0;
  const transferAmount = order.transferAmount ?? order.amount;
  const hasFrozenWallet = frozenAmount > 0;

  return (
    <section className="pending-transfer-panel" data-testid="pending-transfer-panel">
      <div className="pending-transfer-head">
        <div>
          <h2>银行转账处理中</h2>
          <p>如需更换支付方式，请先取消当前银行转账。</p>
        </div>
      </div>

      <div className="pending-transfer-card">
        <div className="pending-method-stack">
          <div className="pending-method-row transfer">
            <div className="pending-method-main">
              <span className="flow-icon">
                <Icon src={ICONS.weiqifu} tone="native" />
              </span>
              <div>
                <strong>腾讯微企付</strong>
                <p>请联系财务同事根据转账信息完成付款</p>
              </div>
            </div>
            <div className="pending-method-side">
              <div className="pending-method-amount">
                <span>待转账</span>
                <strong>{formatCurrency(transferAmount)}</strong>
                {hasFrozenWallet ? (
                  <em>
                    订单金额 {formatCurrency(order.amount)}，企业钱包抵扣{" "}
                    {formatCurrency(frozenAmount)}
                  </em>
                ) : null}
              </div>
            </div>
          </div>

          <div className="pending-transfer-info">
            <p>收款方：{order.payeeName}</p>
            <p>截止时间：请在 {order.flowExpireAt} 前完成转账付款</p>
          </div>

        </div>
        <div className="pending-transfer-actions">
          <button
            className="flow-action-button outline"
            data-testid="cancel-transfer"
            onClick={onCancel}
            type="button"
          >
            取消
          </button>
          <button className="flow-action-button" onClick={onQuery} type="button">
            已转账
          </button>
          <button
            className="flow-action-button primary"
            onClick={onContinue}
            type="button"
          >
            继续转账
          </button>
        </div>
      </div>
    </section>
  );
}

function BankTransferSection({
  mode,
  selectedMethod,
  order,
  onQuery,
  onSelect,
  onCancel,
  transferLocked,
}) {
  const hasActiveFlow = mode === "pending";

  return (
    <section className="cashier-section bank-section">
      <div className="section-title-row">
        <h2>银行转账</h2>
      </div>

      {hasActiveFlow ? (
        <TransferFlowCard order={order} onQuery={onQuery} onCancel={onCancel} />
      ) : (
        <TransferOptionCard
          locked={transferLocked}
          selectedMethod={selectedMethod}
          onSelect={onSelect}
        />
      )}
    </section>
  );
}

function OnlinePaySection({
  mode,
  selectedMethod,
  onSelect,
  walletCoversOrder,
}) {
  const locked = mode === "pending" || mode === "paid" || walletCoversOrder;

  return (
    <section className={`cashier-section online-section ${locked ? "locked" : ""}`}>
      <div className="section-title-row">
        <h2>在线支付</h2>
        {mode === "pending" ? (
          <span>当前存在进行中的腾讯微企付，请取消后再选择其他支付方式</span>
        ) : null}
      </div>
      <div className="payment-grid">
        {ONLINE_METHODS.map((method) => (
          <button
            className={`payment-card ${
              selectedMethod === method.key ? "selected" : ""
            }`}
            data-testid={`online-${method.key}`}
            disabled={locked}
            key={method.key}
            onClick={() => onSelect(method.key)}
            type="button"
          >
            <span className="option-check" />
            <Icon src={method.icon} tone={method.tone} />
            <span>{method.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function BottomBar({ order, mode, walletSelected, selectedMethod, onPrimary }) {
  const walletUse = getWalletUseAmount(order, walletSelected);
  const remainingAfterWallet = Math.max(order.amount - walletUse, 0);
  const pendingAmount = order.transferAmount ?? order.amount;
  const onlineReady = Boolean(selectedMethod && selectedMethod !== "transfer");
  const transferReady = selectedMethod === "transfer" || mode === "pending";
  const walletFullReady = walletSelected && walletUse > 0 && remainingAfterWallet === 0;
  const disabled =
    mode === "paid" ||
    (!transferReady && !onlineReady && !walletFullReady);
  const label = mode === "pending" ? "继续转账" : "立即支付";
  const payableAmount =
    mode === "pending" ? pendingAmount : walletSelected ? remainingAfterWallet : order.amount;

  return (
    <footer className="bottom-bar">
      <div className="payable">
        <span>待支付：</span>
        <strong>{formatCurrency(payableAmount)}</strong>
      </div>
      <button
        className={`bottom-primary ${disabled ? "disabled" : ""} ${
          mode === "paid" ? "complete" : ""
        }`}
        data-testid="primary-action"
        disabled={disabled}
        onClick={onPrimary}
        type="button"
      >
        {label}
      </button>
    </footer>
  );
}

function CancelDialog({ onClose, onConfirm }) {
  return (
    <div className="modal-layer" role="dialog" aria-modal="true">
      <div className="dialog">
        <h3>取消本次银行转账？</h3>
        <p>
          如果财务已经使用该信息发起转账，不建议取消。取消后原腾讯微企付转账信息和转账附言将失效，但不会关闭当前订单。
        </p>
        <div className="dialog-actions">
          <button className="secondary-button" onClick={onClose} type="button">
            暂不取消
          </button>
          <button className="danger-button" onClick={onConfirm} type="button">
            确认取消
          </button>
        </div>
      </div>
    </div>
  );
}

function QueryResultDialog({ onClose }) {
  return (
    <div className="modal-layer" role="dialog" aria-modal="true">
      <div className="dialog query-dialog">
        <h3>查询结果</h3>
        <p>暂未查询到到账结果，请稍后再试。</p>
        <div className="dialog-actions">
          <button className="dark-button" onClick={onClose} type="button">
            知道了
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingOverlay({ label = "处理中" }) {
  return (
    <div className="loading-layer" role="status" aria-live="polite">
      <div className="loading-box">
        <span className="loading-spinner" />
        <strong>{label}</strong>
      </div>
    </div>
  );
}

function WeiqifuPage({ order, onResolve }) {
  const transferAmount = order.transferAmount ?? order.amount;

  return (
    <main className="weiqifu-page">
      <header className="weiqifu-header">
        <div className="tencent-logo">
          <strong>腾讯金融科技</strong>
          <span>TENCENT FINANCIAL TECHNOLOGY</span>
        </div>
        <div className="weiqifu-logo-title">
          <Icon src={ICONS.weiqifu} tone="native" />
          <strong>腾讯微企付</strong>
        </div>
      </header>

      <section className="weiqifu-stage">
        <div className="weiqifu-card">
          <div className="weiqifu-card-amount">
            <span>订单商城</span>
            <strong>{formatCurrency(transferAmount)}</strong>
          </div>

          <div className="weiqifu-divider" />

          <div className="weiqifu-form-row">
            <label>付款方式</label>
            <div className="account-tabs">
              <button type="button">个人账户</button>
              <button className="active" type="button">企业账户</button>
              <button type="button">分享给好友付款</button>
            </div>
          </div>

          <div className="weiqifu-form-row">
            <label>付款户名</label>
            <button className="payer-select" type="button">
              深圳XXXXXXXX有限公司
              <span>⌄</span>
            </button>
          </div>

          <div className="weiqifu-form-row transfer-info-row">
            <label>转账信息</label>
            <div className="transfer-info-card">
              <div className="transfer-info-head">
                <strong>复制到企业网银转账</strong>
                <button type="button">复制全部</button>
              </div>
              <div className="transfer-info-body">
                <p className="transfer-deadline">
                  请在 {order.flowExpireAt} 前完成转账，超时将支付失败。
                </p>
                <dl>
                  <div>
                    <dt>收款户名</dt>
                    <dd>{order.payeeName}</dd>
                    <button type="button">复制</button>
                  </div>
                  <div>
                    <dt>收款账号</dt>
                    <dd>XXXX XXXX XXXX XXXX 0938 00</dd>
                    <button type="button">复制</button>
                  </div>
                  <div>
                    <dt>银行名称</dt>
                    <dd>浙江银行 上海分行</dd>
                    <button type="button">指引</button>
                  </div>
                  <div>
                    <dt>银行行号</dt>
                    <dd>XXXXXXXXXX</dd>
                    <button type="button">复制</button>
                  </div>
                  <div>
                    <dt>转账附言</dt>
                    <dd>{order.transferRemark}</dd>
                    <button type="button">复制</button>
                  </div>
                </dl>
                <div className="transfer-warning">
                  务必粘贴在附言、备注和用途中，不填写会导致付款失败
                </div>
              </div>
            </div>
          </div>

          <div className="weiqifu-refresh">
            5～15 分钟更新结果，以收款行到账为准。
          </div>

          <div className="weiqifu-demo-actions">
          <button
            className="success"
            data-testid="weiqifu-success"
            onClick={() => onResolve("success")}
            type="button"
          >
            成功
          </button>
          <button
            className="failed"
            data-testid="weiqifu-failed"
            onClick={() => onResolve("failed")}
            type="button"
          >
            失败
          </button>
          <button
            className="pending"
            data-testid="weiqifu-finance"
            onClick={() => onResolve("finance")}
            type="button"
          >
            找财务转账
          </button>
          </div>

          <div className="weiqifu-divider" />

          <div className="transfer-guidance">
            <h3>转账须知</h3>
            <ol>
              <li>请确认收款户名和收款账号是否按要求填写；</li>
              <li>请确认您填写的收款银行为“新增银行”；</li>
              <li>转账后，系统需要 5-15 分钟更新订单状态；</li>
              <li>如遇银行大额交易系统关闭时间，资金将在交易恢复后陆续到账；</li>
              <li>因未按要求转账导致订单无法付款成功，已转账资金将在 24 小时内退回。</li>
            </ol>
          </div>
        </div>

        <div className="weiqifu-security">腾讯金融科技保障服务安全</div>
      </section>

      <footer className="weiqifu-footer">
        Powered By Tencent & Tenpay&nbsp;&nbsp; Copyright 2005-2026 Tencent All Rights Reserved.
      </footer>
    </main>
  );
}

function MerchantResultPage({ order, onBack }) {
  return (
    <main className="merchant-page">
      <header className="merchant-page-header">
        <img src={ICONS.merchantLogo} alt="Peet's Coffee" />
      </header>

      <section className="merchant-success-panel">
        <div className="merchant-success-mark">✓</div>
        <h1>订单支付成功</h1>
        <p className="merchant-success-subtitle">
          您的企业采购订单已完成支付，商家将继续处理后续履约。
        </p>

        <div className="merchant-order-card">
          <div>
            <span>订单编号</span>
            <strong>{order.orderNo}</strong>
          </div>
          <div>
            <span>支付金额</span>
            <strong>{formatCurrency(order.amount)}</strong>
          </div>
          <div>
            <span>支付方式</span>
            <strong>{order.resultMethod ?? "腾讯微企付"}</strong>
          </div>
        </div>

        <div className="merchant-result-actions">
          <button className="merchant-primary" type="button">
            查看订单
          </button>
          <button className="merchant-secondary" onClick={onBack} type="button">
            继续选购
          </button>
        </div>
      </section>
    </main>
  );
}

export function App() {
  const [selectedScenario, setSelectedScenario] = useState("recharge");
  const [selectedPaymentCase, setSelectedPaymentCase] = useState("payment-200");
  const [order, setOrder] = useState(() => createRuntimeOrder("recharge", "payment-200"));
  const [page, setPage] = useState("simulator");
  const [mode, setMode] = useState("idle");
  const [walletSelected, setWalletSelected] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("处理中");
  const [queryDialogOpen, setQueryDialogOpen] = useState(false);

  const visibleMethod = useMemo(() => {
    if (mode === "pending") return "transfer";
    return selectedMethod;
  }, [mode, selectedMethod]);

  const walletUse = getWalletUseAmount(order, walletSelected);
  const remainingAfterWallet = Math.max(order.amount - walletUse, 0);
  const walletCoversOrder = walletSelected && walletUse >= order.amount;

  function submitScenario() {
    const nextOrder = createRuntimeOrder(selectedScenario, selectedPaymentCase);
    setOrder(nextOrder);
    setPage("cashier");
    setMode("idle");
    setWalletSelected(false);
    setSelectedMethod(null);
    setCancelOpen(false);
    setQueryDialogOpen(false);
  }

  function returnToSimulator() {
    setPage("simulator");
    setMode("idle");
    setWalletSelected(false);
    setSelectedMethod(null);
    setCancelOpen(false);
    setQueryDialogOpen(false);
    setLoading(false);
  }

  function selectWallet() {
    if (!order.enterpriseCustomerId || mode !== "idle" || order.walletAvailable <= 0) {
      return;
    }

    const nextSelected = !walletSelected;
    const nextWalletUse =
      nextSelected && order.walletAvailable > 0
        ? Math.min(order.walletAvailable, order.amount)
        : 0;
    const nextWalletCoversOrder = nextSelected && nextWalletUse >= order.amount;

    setWalletSelected(nextSelected);
    if (nextWalletCoversOrder || (nextSelected && selectedMethod !== "transfer")) {
      setSelectedMethod(null);
    }
  }

  function selectTransfer() {
    if (mode === "paid" || walletCoversOrder) return;
    setQueryDialogOpen(false);
    setSelectedMethod("transfer");
  }

  function selectOnline(method) {
    if (mode === "pending" || mode === "paid" || walletCoversOrder) {
      return;
    }
    setQueryDialogOpen(false);
    if (!walletSelected) {
      setWalletSelected(false);
    }
    setSelectedMethod(method);
  }

  function openWeiqifuWithTransfer() {
    const frozenAmount = walletSelected ? walletUse : 0;
    const transferAmount =
      walletSelected && remainingAfterWallet > 0 ? remainingAfterWallet : order.amount;

    setOrder((current) => ({
      ...current,
      walletAvailable:
        typeof current.walletAvailable === "number"
          ? current.walletAvailable - frozenAmount
          : null,
      walletFrozen: frozenAmount,
      walletUsedAmount: frozenAmount,
      transferAmount,
      transferStatus: "created",
      resultMethod: frozenAmount > 0 ? "企业钱包账户 + 腾讯微企付" : "腾讯微企付",
    }));
    setPage("weiqifu");
  }

  function completeWalletOnlyPayment() {
    const walletDebitAmount = walletUse;

    flushSync(() => {
      setLoadingLabel("扣款中");
      setLoading(true);
      setQueryDialogOpen(false);
    });

    window.setTimeout(() => {
      setOrder((current) => ({
        ...current,
        walletAvailable:
          typeof current.walletAvailable === "number"
            ? current.walletAvailable - walletDebitAmount
            : null,
        walletUsedAmount: walletDebitAmount,
        resultMethod: "企业钱包账户",
      }));
      setLoading(false);
      setLoadingLabel("处理中");
      setMode("paid");
      setPage("merchant");
      setWalletSelected(false);
      setSelectedMethod(null);
    }, 850);
  }

  function completeOnlinePayment() {
    const methodLabel =
      ONLINE_METHODS.find((method) => method.key === selectedMethod)?.label ?? "在线支付";
    const walletDebitAmount = walletSelected ? walletUse : 0;

    flushSync(() => {
      setLoadingLabel("支付中");
      setLoading(true);
      setQueryDialogOpen(false);
    });

    window.setTimeout(() => {
      setOrder((current) => ({
        ...current,
        walletAvailable:
          typeof current.walletAvailable === "number"
            ? current.walletAvailable - walletDebitAmount
            : null,
        walletUsedAmount: walletDebitAmount,
        resultMethod:
          walletDebitAmount > 0 ? `企业钱包账户 + ${methodLabel}` : methodLabel,
      }));
      setLoading(false);
      setLoadingLabel("处理中");
      setMode("paid");
      setPage("merchant");
      setWalletSelected(false);
      setSelectedMethod(null);
    }, 850);
  }

  function primaryAction() {
    if (mode === "pending") {
      setPage("weiqifu");
      return;
    }

    if (walletSelected && walletUse > 0 && remainingAfterWallet === 0) {
      completeWalletOnlyPayment();
      return;
    }

    if (selectedMethod === "transfer") {
      openWeiqifuWithTransfer();
      return;
    }

    if (selectedMethod) {
      completeOnlinePayment();
    }
  }

  function confirmCancel() {
    setOrder((current) => ({
      ...releaseWalletFreeze(current),
      transferAmount: null,
      transferStatus: null,
      resultMethod: null,
    }));
    setMode("idle");
    setSelectedMethod(null);
    setWalletSelected(false);
    setQueryDialogOpen(false);
    setCancelOpen(false);
  }

  function queryTransferResult() {
    if (mode !== "pending") return;
    flushSync(() => {
      setLoadingLabel("查询中");
      setLoading(true);
      setQueryDialogOpen(false);
    });

    window.setTimeout(() => {
      setLoading(false);
      setLoadingLabel("处理中");
      setQueryDialogOpen(true);
    }, 850);
  }

  function resolveWeiqifu(result) {
    const hasFrozenWallet = (order.walletFrozen ?? 0) > 0;

    flushSync(() => {
      setPage("cashier");
      setLoadingLabel("处理中");
      setLoading(true);
      setQueryDialogOpen(false);
    });

    window.setTimeout(() => {
      setLoading(false);
      setLoadingLabel("处理中");

      if (result === "success") {
        setOrder((current) => ({
          ...current,
          walletFrozen: 0,
          transferStatus: "success",
          resultMethod: current.resultMethod ?? "腾讯微企付",
        }));
        setMode("paid");
        setPage("merchant");
        setWalletSelected(false);
        setSelectedMethod(null);
        return;
      }

      if (result === "finance") {
        setMode("pending");
        setSelectedMethod("transfer");
        setWalletSelected(hasFrozenWallet);
        return;
      }

      setOrder((current) => ({
        ...releaseWalletFreeze(current),
        transferAmount: null,
        transferStatus: "failed",
        resultMethod: null,
      }));
      setMode("idle");
      setWalletSelected(false);
      setSelectedMethod(null);
    }, 850);
  }

  if (page === "simulator") {
    return (
      <OrderSimulatorPage
        selectedScenario={selectedScenario}
        selectedPaymentCase={selectedPaymentCase}
        onScenarioChange={setSelectedScenario}
        onPaymentCaseChange={setSelectedPaymentCase}
        onSubmit={submitScenario}
      />
    );
  }

  if (page === "weiqifu") {
    return <WeiqifuPage order={order} onResolve={resolveWeiqifu} />;
  }

  if (page === "merchant" || mode === "paid") {
    return <MerchantResultPage order={order} onBack={returnToSimulator} />;
  }

  return (
    <>
      <AppHeader onBack={returnToSimulator} />
      <main className="page-shell">
        <OrderSummary order={order} />

        <section className="cashier-panel">
          {mode === "pending" ? (
            <PendingTransferPanel
              order={order}
              onContinue={primaryAction}
              onQuery={queryTransferResult}
              onCancel={() => setCancelOpen(true)}
            />
          ) : (
            <>
              <EnterpriseWalletSection
                order={order}
                mode={mode}
                selected={walletSelected}
                onToggle={selectWallet}
              />
              <BankTransferSection
                mode={mode}
                selectedMethod={visibleMethod}
                order={order}
                onQuery={queryTransferResult}
                onSelect={selectTransfer}
                onCancel={() => setCancelOpen(true)}
                transferLocked={walletCoversOrder}
              />
              <OnlinePaySection
                mode={mode}
                selectedMethod={visibleMethod}
                onSelect={selectOnline}
                walletCoversOrder={walletCoversOrder}
              />
            </>
          )}
        </section>
      </main>
      {mode !== "pending" ? (
        <BottomBar
          order={order}
          mode={mode}
          walletSelected={walletSelected}
          selectedMethod={visibleMethod}
          onPrimary={primaryAction}
        />
      ) : null}
      {cancelOpen ? (
        <CancelDialog onClose={() => setCancelOpen(false)} onConfirm={confirmCancel} />
      ) : null}
      {queryDialogOpen ? (
        <QueryResultDialog onClose={() => setQueryDialogOpen(false)} />
      ) : null}
      {loading ? <LoadingOverlay label={loadingLabel} /> : null}
    </>
  );
}

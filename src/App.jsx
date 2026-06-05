import { useMemo, useState } from "react";
import { flushSync } from "react-dom";

const ICONS = {
  back: "/icons/chevron-left.svg",
  down: "/icons/angle-down.svg",
  merchantLogo: "/icons/merchant-logo.png",
  weiqifu: "/icons/weiqifu.png",
  info: "/icons/circle-info.svg",
  weixin: "/icons/weixin.svg",
  alipay: "/icons/alipay.svg",
  card: "/icons/credit-card.svg",
};

const MODES = [
  { key: "idle", label: "未发起" },
  { key: "pending", label: "待转账" },
  { key: "paid", label: "结果页" },
];

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

const ORDER = {
  amount: "￥32,000.00",
  payable: "￥32,000.00",
  orderNo: "57372319938",
  transferNo: "WQF20260604000189",
  tenderNo: "LP20260604009382",
  createdAt: "2026-06-04 10:28",
  flowExpireAt: "2026-06-19 10:28",
  payeeName: "皮氏咖啡(上海)有限公司",
};

const MODE_COPY = {
  idle: {
    bottomLabel: "立即支付",
    bottomDisabled: true,
  },
  pending: {
    bottomLabel: "继续转账",
    bottomDisabled: false,
  },
  paid: {
    bottomLabel: "",
    bottomDisabled: true,
  },
};

function normalizeMode(mode) {
  if (mode === "cancelled" || mode === "expired") return "idle";
  return MODES.some((item) => item.key === mode) ? mode : "pending";
}

function getInitialMode() {
  if (typeof window === "undefined") return "pending";
  const requestedMode = new URLSearchParams(window.location.search).get("state");
  return normalizeMode(requestedMode);
}

function syncUrlMode(nextMode) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.set("state", nextMode);
  url.searchParams.delete("page");
  window.history.replaceState({}, "", url);
}

function syncUrlPage(page) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (page === "cashier") {
    url.searchParams.delete("page");
  } else {
    url.searchParams.set("page", page);
  }
  window.history.replaceState({}, "", url);
}

function Icon({ src, tone = "dark", className = "" }) {
  return <img className={`icon icon-${tone} ${className}`} src={src} alt="" />;
}

function AppHeader() {
  return (
    <header className="topbar">
      <button className="back-button" type="button">
        <Icon src={ICONS.back} className="back-icon" />
        返回
      </button>
      <img className="brand-logo" src={ICONS.merchantLogo} alt="Peet's Coffee" />
      <button className="language-button" type="button">
        中文
        <Icon src={ICONS.down} className="down-icon" />
      </button>
    </header>
  );
}

function OrderSummary() {
  return (
    <section className="order-summary">
      <div className="order-copy">
        <p className="order-title">订单提交成功，请尽快付款。</p>
        <p>
          请您在 <span className="danger">14 天 23 小时 59 分</span>{" "}
          内完成支付，否则订单将被自动关闭
        </p>
        <p>订单编号： {ORDER.orderNo}</p>
      </div>
      <div className="amount-block">
        <span>订单金额</span>
        <strong>{ORDER.amount}</strong>
      </div>
    </section>
  );
}

function TransferOptionCard({ selectedMethod, onStart }) {
  const isSelected = selectedMethod === "transfer";

  return (
    <button
      className={`transfer-option ${isSelected ? "selected" : ""}`}
      onClick={onStart}
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

function TransferFlowCard({ onQuery, onCancel }) {
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
              <p>收款方：{ORDER.payeeName}</p>
              <p>截止时间：请在 {ORDER.flowExpireAt} 前完成转账付款</p>
            </div>
          </div>
        </div>
        <div className="flow-head-actions">
          <button className="flow-action-button primary" onClick={onQuery} type="button">
            已转账
          </button>
          <button className="flow-action-button outline" onClick={onCancel} type="button">
            取消
          </button>
        </div>
      </div>
    </div>
  );
}

function BankTransferSection({
  mode,
  selectedMethod,
  onQuery,
  onStart,
  onCancel,
}) {
  const hasActiveFlow = mode === "pending";

  return (
    <section className="cashier-section bank-section">
      <div className="section-title-row">
        <h2>银行转账</h2>
      </div>

      {hasActiveFlow ? (
        <TransferFlowCard
          onQuery={onQuery}
          onCancel={onCancel}
        />
      ) : (
        <TransferOptionCard
          selectedMethod={selectedMethod}
          onStart={onStart}
        />
      )}
    </section>
  );
}

function OnlinePaySection({ mode, selectedMethod, onSelect }) {
  const locked = mode === "pending" || mode === "paid";

  return (
    <section className={`cashier-section online-section ${locked ? "locked" : ""}`}>
      <div className="section-title-row">
        <h2>在线支付</h2>
        {locked && mode === "pending" ? (
          <span>当前存在进行中的腾讯微企付，请取消后再选择其他支付方式</span>
        ) : null}
      </div>
      <div className="payment-grid">
        {ONLINE_METHODS.map((method) => (
          <button
            className={`payment-card ${
              selectedMethod === method.key ? "selected" : ""
            }`}
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

function BottomBar({ mode, selectedMethod, onPrimary }) {
  const copy = MODE_COPY[mode];
  const onlineReady = Boolean(selectedMethod && selectedMethod !== "transfer");
  const transferReady = selectedMethod === "transfer" || mode === "pending";
  const disabled = copy.bottomDisabled && !onlineReady && !transferReady;
  let label = copy.bottomLabel;

  if (onlineReady || (selectedMethod === "transfer" && mode !== "pending")) {
    label = "立即支付";
  }

  return (
    <footer className="bottom-bar">
      <div className="payable">
        <span>待支付：</span>
        <strong>{ORDER.payable}</strong>
      </div>
      <button
        className={`bottom-primary ${disabled ? "disabled" : ""} ${
          mode === "paid" ? "complete" : ""
        }`}
        disabled={disabled || mode === "paid"}
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

function WeiqifuPage({ onResolve }) {
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
            <strong>{ORDER.amount}</strong>
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
                  请在 {ORDER.flowExpireAt} 前完成转账，超时将支付失败。
                </p>
                <dl>
                  <div>
                    <dt>收款户名</dt>
                    <dd>{ORDER.payeeName}</dd>
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
                    <dd>WQ12345678987</dd>
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
            <button className="success" onClick={() => onResolve("success")} type="button">
              成功
            </button>
            <button className="failed" onClick={() => onResolve("failed")} type="button">
              失败
            </button>
            <button className="pending" onClick={() => onResolve("finance")} type="button">
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

function MerchantResultPage({ onBack }) {
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
            <strong>{ORDER.orderNo}</strong>
          </div>
          <div>
            <span>支付金额</span>
            <strong>{ORDER.amount}</strong>
          </div>
          <div>
            <span>支付方式</span>
            <strong>腾讯微企付</strong>
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
  const initialMode = getInitialMode();
  const initialPage =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("page") === "weiqifu"
      ? "weiqifu"
      : "cashier";
  const [mode, setMode] = useState(initialMode);
  const [selectedMethod, setSelectedMethod] = useState(
    initialMode === "pending" || initialMode === "paid" ? "transfer" : null,
  );
  const [cancelOpen, setCancelOpen] = useState(false);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("处理中");
  const [queryDialogOpen, setQueryDialogOpen] = useState(false);

  const isTerminal = mode === "paid";

  const visibleMethod = useMemo(() => {
    if (mode === "pending" || mode === "paid") return "transfer";
    return selectedMethod;
  }, [mode, selectedMethod]);

  function changeMode(nextMode) {
    const normalizedMode = normalizeMode(nextMode);
    setMode(normalizedMode);
    syncUrlMode(normalizedMode);
    setCancelOpen(false);
    setPage("cashier");
    syncUrlPage("cashier");
    setLoading(false);
    setQueryDialogOpen(false);
    if (normalizedMode === "pending") {
      setSelectedMethod("transfer");
    } else {
      setSelectedMethod(null);
    }
  }

  function selectTransfer() {
    if (isTerminal) return;
    setQueryDialogOpen(false);
    setSelectedMethod("transfer");
  }

  function startTransfer() {
    if (isTerminal) return;
    setSelectedMethod("transfer");
    setQueryDialogOpen(false);
    setPage("weiqifu");
    syncUrlPage("weiqifu");
  }

  function selectOnline(method) {
    if (mode === "pending" || mode === "paid") return;
    setQueryDialogOpen(false);
    setSelectedMethod(method);
  }

  function primaryAction() {
    if (mode === "pending") {
      setPage("weiqifu");
      syncUrlPage("weiqifu");
      return;
    }
    if (selectedMethod === "transfer") {
      startTransfer();
      return;
    }
    if (selectedMethod) {
      setMode("paid");
      syncUrlMode("paid");
      setSelectedMethod("transfer");
    }
  }

  function confirmCancel() {
    setMode("idle");
    syncUrlMode("idle");
    setSelectedMethod(null);
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
    flushSync(() => {
      setPage("cashier");
      setLoadingLabel("处理中");
      setLoading(true);
      setQueryDialogOpen(false);
      setSelectedMethod(result === "finance" ? "transfer" : null);
    });
    syncUrlPage("cashier");

    window.setTimeout(() => {
      setLoading(false);
      if (result === "success") {
        setMode("paid");
        syncUrlMode("paid");
        setSelectedMethod(null);
      } else if (result === "finance") {
        setMode("pending");
        syncUrlMode("pending");
        setSelectedMethod("transfer");
      } else {
        setMode("idle");
        syncUrlMode("idle");
        setSelectedMethod(null);
      }
    }, 850);
  }

  if (page === "weiqifu") {
    return <WeiqifuPage onResolve={resolveWeiqifu} />;
  }

  if (mode === "paid") {
    return <MerchantResultPage onBack={() => changeMode("idle")} />;
  }

  return (
    <>
      <AppHeader />
      <main className="page-shell">
        <OrderSummary />

        <section className="cashier-panel">
          <BankTransferSection
            mode={mode}
            selectedMethod={visibleMethod}
            onQuery={queryTransferResult}
            onStart={selectTransfer}
            onCancel={() => setCancelOpen(true)}
          />
          <OnlinePaySection
            mode={mode}
            selectedMethod={visibleMethod}
            onSelect={selectOnline}
          />
        </section>
      </main>
      <BottomBar
        mode={mode}
        selectedMethod={visibleMethod}
        onPrimary={primaryAction}
      />
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

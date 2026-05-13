import React, { useMemo, useState } from "react";

const GRAVITY = 9.80665;

const PRESETS = {
  t91: {
    id: "t91",
    family: "rifle",
    label: "T91 步槍",
    muzzleVelocity: 840,
    sightHeight: 7.5,
    ammo: "M855",
    ballisticCoefficient: 0.304,
    dragModel: "G1",
    defaultZero: 300,
    defaultTarget: 10,
    sightHeightNote:
      "T91 預設抓 lower 1/3 cowitness：皮軌到槍管中心約 1.37\" / 3.5 cm，加上瞄具中心約 1.57\" / 4.0 cm，瞄準高度約 7.5 cm。"
  },
  t112: {
    id: "t112",
    family: "rifle",
    label: "T112 步槍",
    muzzleVelocity: 880,
    sightHeight: 7.5,
    ammo: "M855",
    ballisticCoefficient: 0.304,
    dragModel: "G1",
    defaultZero: 300,
    defaultTarget: 10,
    sightHeightNote:
      "T112 預設同 T91 抓 lower 1/3 cowitness：3.5 cm 皮軌高度 + 4.0 cm 瞄具中心，瞄準高度約 7.5 cm。"
  },
  t65: {
    id: "t65",
    family: "rifle",
    label: "T65 (20\" 5.56)",
    muzzleVelocity: 975,
    sightHeight: 6.6,
    ammo: "M193",
    ballisticCoefficient: 0.243,
    dragModel: "G1",
    defaultZero: 300,
    defaultTarget: 10,
    sightHeightNote:
      "T65 20\" 5.56 預設抓傳統機械瞄具約 2.6\" HOB，換算約 6.6 cm；若加裝高架光學瞄具，請依實際高度改填。"
  },
  pistol4: {
    id: "pistol4",
    family: "pistol",
    label: "手槍 4 吋",
    muzzleVelocity: 346,
    sightHeight: 2,
    ammo: "9mm 115gr",
    ballisticCoefficient: 0.14,
    dragModel: "G1",
    defaultZero: 25,
    defaultTarget: 10,
    sightHeightNote:
      "手槍 4 吋預設瞄準高度 2.0 cm，代表槍管中心到瞄具中心的估算距離。"
  }
};

const ZERO_SHORTCUTS = [
  { label: "50/200m 歸零", zero: 200 },
  { label: "25/300m 歸零", zero: 300 }
];

const CUSTOM_AMMO_LABEL = "自行填寫";
const TRAJECTORY_DISTANCES = [25, 50, 100, 200, 300, 400, 500];
const HELP_TEXT = {
  preset: "選擇常用槍枝預設值，會帶入初速、瞄準高度與常用彈種。",
  zeroShortcut: "快速套用常見歸零設定。按下後只會改變歸零距離，靶紙距離維持原本設定。",
  targetDistance: "實際放置靶紙並射擊的距離。紅圈會顯示這個距離下的預期彈著位置。",
  zeroDistance: "希望彈道與瞄準線交會的距離。系統會依此推算近距離靶紙上的應有落點。",
  ammo: "選擇常見彈種後，系統會帶入對應的彈頭重量、初速與彈道係數估值。",
  bulletWeight: "彈頭重量以 grain 表示。手動修改後，彈種會切換為「自行填寫」。",
  muzzleVelocity: "子彈離開槍口時的速度，單位為 m/s。初速越高，近距離到遠距離的下墜通常越小。",
  sightHeight: "槍管中心到瞄具中心的垂直距離。這會影響近距離歸零時彈著點的位置。",
  ballisticCoefficient: "描述彈頭維持速度能力的估值。數值越高，遠距離速度衰減與下墜通常越少。",
  dragModel: "選擇彈道係數使用的模型。一般步槍彈多用 G1，部分長尖彈可用 G7。",
  gridSize: "靶紙格線的實際尺寸。列印時請用 100% 比例，並用 5 cm 比例尺檢查。",
  clickValue: "每轉一格旋鈕代表的角度量，例如 0.25 MOA 或 0.1 MRAD。",
  clickMode: "選擇瞄具旋鈕角度單位，用來換算「旋鈕補正」需要調整幾 Click。"
};

const AMMO_OPTIONS = [
  {
    id: "m855",
    family: "rifle",
    label: "M855",
    bulletWeightGr: 62,
    muzzleVelocity: 840,
    ballisticCoefficient: 0.304,
    velocityByPreset: { t91: 840, t112: 880, t65: 930 }
  },
  {
    id: "m193",
    family: "rifle",
    label: "M193",
    bulletWeightGr: 55,
    muzzleVelocity: 930,
    ballisticCoefficient: 0.243,
    velocityByPreset: { t91: 900, t112: 930, t65: 975 }
  },
  {
    id: "mk262",
    family: "rifle",
    label: "77gr OTM",
    bulletWeightGr: 77,
    muzzleVelocity: 820,
    ballisticCoefficient: 0.372,
    velocityByPreset: { t91: 790, t112: 820, t65: 850 }
  },
  {
    id: "m80",
    family: "rifle",
    label: "7.62x51mm M80",
    bulletWeightGr: 147,
    muzzleVelocity: 838,
    ballisticCoefficient: 0.398,
    velocityByPreset: {}
  },
  {
    id: "nine115",
    family: "pistol",
    label: "9mm 115gr",
    bulletWeightGr: 115,
    muzzleVelocity: 346,
    ballisticCoefficient: 0.14,
    velocityByPreset: { pistol4: 346 }
  },
  {
    id: "nine124",
    family: "pistol",
    label: "9mm 124gr",
    bulletWeightGr: 124,
    muzzleVelocity: 335,
    ballisticCoefficient: 0.15,
    velocityByPreset: { pistol4: 335 }
  },
  {
    id: "nine147",
    family: "pistol",
    label: "9mm 147gr",
    bulletWeightGr: 147,
    muzzleVelocity: 300,
    ballisticCoefficient: 0.17,
    velocityByPreset: { pistol4: 300 }
  }
];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const safeNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

function estimateFlightTime(distanceM, muzzleVelocity, ballisticCoefficient, dragModel) {
  const bc = Math.max(ballisticCoefficient, 0.05);
  const dragBase = dragModel === "G7" ? 9000 : 6500;
  const velocityLoss = clamp(distanceM / (bc * dragBase), 0, 0.55);
  const averageVelocity = muzzleVelocity * (1 - velocityLoss / 2);
  return distanceM / Math.max(averageVelocity, 1);
}

function solveSightAngle(zeroDistanceM, sightHeightCm, muzzleVelocity, ballisticCoefficient, dragModel) {
  const zeroDistance = Math.max(zeroDistanceM, 1);
  const sightHeightM = sightHeightCm / 100;
  const zeroTime = estimateFlightTime(
    zeroDistance,
    muzzleVelocity,
    ballisticCoefficient,
    dragModel
  );
  const riseM = sightHeightM + 0.5 * GRAVITY * zeroTime * zeroTime;
  return Math.atan(riseM / zeroDistance);
}

function trajectoryCmAt(distanceM, angleRad, sightHeightCm, muzzleVelocity, ballisticCoefficient, dragModel) {
  const distance = Math.max(distanceM, 0);
  const sightHeightM = sightHeightCm / 100;
  const time = estimateFlightTime(distance, muzzleVelocity, ballisticCoefficient, dragModel);
  const verticalM = distance * Math.tan(angleRad) - 0.5 * GRAVITY * time * time;
  return (verticalM - sightHeightM) * 100;
}

function clickSizeCmAtTarget(clickMode, clickValue, distanceM) {
  if (clickMode === "moa") {
    return clickValue * 2.90888 * (distanceM / 100);
  }
  if (clickMode === "mrad") {
    return clickValue * 10 * (distanceM / 100);
  }
  return clickValue;
}

function formatSigned(value, digits = 1) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}`;
}

function describeVerticalOffset(cm) {
  if (Math.abs(cm) < 0.05) {
    return "與瞄準點重合";
  }
  return `瞄準點${cm > 0 ? "上方" : "下方"} ${Math.abs(cm).toFixed(1)} cm`;
}

function describeCorrection(cm) {
  if (Math.abs(cm) < 0.05) {
    return "無需補正";
  }
  return `${cm > 0 ? "往上" : "往下"} ${Math.abs(cm).toFixed(1)} cm`;
}

function getYAxisStep(yMin, yMax) {
  const range = yMax - yMin;
  const magnitude = Math.max(Math.abs(yMin), Math.abs(yMax));
  if (magnitude > 300 || range > 500) {
    return 50;
  }
  if (magnitude > 150 || range > 250) {
    return 25;
  }
  if (yMin < -50 || yMax > 50 || range > 100) {
    return 10;
  }
  return 5;
}

function getMinorYAxisStep(labelStep) {
  if (labelStep >= 50) {
    return 10;
  }
  if (labelStep >= 25) {
    return 5;
  }
  if (labelStep >= 10) {
    return 2;
  }
  return 1;
}

function makeTicks(min, max, step) {
  const ticks = [];
  const start = Math.ceil(min / step) * step;
  for (let tick = start; tick <= max + step * 0.001; tick += step) {
    ticks.push(Number(tick.toFixed(3)));
  }
  return ticks;
}

function ammoVelocityForPreset(option, presetId) {
  return option.velocityByPreset[presetId] ?? option.muzzleVelocity;
}

function ammoOptionForLabel(label) {
  return AMMO_OPTIONS.find((option) => option.label === label);
}

function HelpTip({ focusable = true, text }) {
  return (
    <span className="help-tip" tabIndex={focusable ? "0" : undefined} aria-label={text}>
      ?
      <span className="help-popover" role="tooltip">
        {text}
      </span>
    </span>
  );
}

function LabelWithHelp({ children, help }) {
  return (
    <span className="label-with-help">
      {children}
      <HelpTip text={help} />
    </span>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState("rifle");
  const [presetId, setPresetId] = useState("t91");
  const [zeroDistance, setZeroDistance] = useState(PRESETS.t91.defaultZero);
  const [targetDistance, setTargetDistance] = useState(PRESETS.t91.defaultTarget);
  const [muzzleVelocity, setMuzzleVelocity] = useState(PRESETS.t91.muzzleVelocity);
  const [sightHeight, setSightHeight] = useState(PRESETS.t91.sightHeight);
  const [ammo, setAmmo] = useState(PRESETS.t91.ammo);
  const [bulletWeightGr, setBulletWeightGr] = useState(
    ammoOptionForLabel(PRESETS.t91.ammo)?.bulletWeightGr ?? ""
  );
  const [ballisticCoefficient, setBallisticCoefficient] = useState(
    PRESETS.t91.ballisticCoefficient
  );
  const [dragModel, setDragModel] = useState(PRESETS.t91.dragModel);
  const [gridCm, setGridCm] = useState(1);
  const [clickMode, setClickMode] = useState("mrad");
  const [clickValue, setClickValue] = useState(0.1);
  const [chartRangeOverride, setChartRangeOverride] = useState(null);

  const selectedPreset = PRESETS[presetId];
  const ammoDescription =
    ammo === CUSTOM_AMMO_LABEL && bulletWeightGr
      ? `${CUSTOM_AMMO_LABEL} ${bulletWeightGr}gr`
      : ammo;
  const zeroDistanceM = Math.max(1, safeNumber(zeroDistance, selectedPreset.defaultZero));
  const targetDistanceM = Math.max(1, safeNumber(targetDistance, selectedPreset.defaultTarget));
  const sightHeightCm = Math.max(0, safeNumber(sightHeight, selectedPreset.sightHeight));
  const ballisticCoefficientValue = Math.max(
    0.01,
    safeNumber(ballisticCoefficient, selectedPreset.ballisticCoefficient)
  );
  const muzzleVelocityMps = Math.max(1, safeNumber(muzzleVelocity, selectedPreset.muzzleVelocity));
  const chartRangeMin = Math.min(
    1000,
    Math.max(50, Math.ceil(Math.max(zeroDistanceM, targetDistanceM) / 5) * 5)
  );
  const defaultChartRange = clamp(zeroDistanceM + 150, chartRangeMin, 1000);
  const chartRangeDistance = clamp(
    chartRangeOverride ?? defaultChartRange,
    chartRangeMin,
    1000
  );

  const ballistic = useMemo(() => {
    const angle = solveSightAngle(
      zeroDistanceM,
      sightHeightCm,
      muzzleVelocityMps,
      ballisticCoefficientValue,
      dragModel
    );
    const impactOffsetCm = trajectoryCmAt(
      targetDistanceM,
      angle,
      sightHeightCm,
      muzzleVelocityMps,
      ballisticCoefficientValue,
      dragModel
    );
    const clickCm = clickSizeCmAtTarget(
      clickMode,
      safeNumber(clickValue, 0.1),
      targetDistanceM
    );
    const correctionCm = -impactOffsetCm;
    const correctionGridCount = correctionCm / safeNumber(gridCm, 1);
    const correctionClickCount = clickCm > 0 ? correctionCm / clickCm : 0;

    return {
      angle,
      clickCm,
      correctionClickCount,
      correctionCm,
      correctionGridCount,
      impactOffsetCm
    };
  }, [
    ballisticCoefficientValue,
    clickMode,
    clickValue,
    dragModel,
    gridCm,
    muzzleVelocityMps,
    sightHeightCm,
    targetDistanceM,
    zeroDistanceM
  ]);

  const displayOffset = `${formatSigned(ballistic.impactOffsetCm, 1)} cm`;

  const applyPreset = (id, nextTab) => {
    const preset = PRESETS[id];
    const presetAmmo = ammoOptionForLabel(preset.ammo);
    setPresetId(id);
    setActiveTab(nextTab ?? preset.family);
    setZeroDistance(preset.defaultZero);
    setTargetDistance(preset.defaultTarget);
    setMuzzleVelocity(preset.muzzleVelocity);
    setSightHeight(preset.sightHeight);
    setAmmo(preset.ammo);
    setBulletWeightGr(presetAmmo?.bulletWeightGr ?? "");
    setBallisticCoefficient(preset.ballisticCoefficient);
    setDragModel(preset.dragModel);
    setChartRangeOverride(null);
  };

  const applyAmmo = (label) => {
    if (label === CUSTOM_AMMO_LABEL) {
      setAmmo(CUSTOM_AMMO_LABEL);
      return;
    }
    const option = ammoOptionForLabel(label);
    if (!option) {
      setAmmo(label);
      return;
    }
    setAmmo(option.label);
    setBulletWeightGr(option.bulletWeightGr);
    setMuzzleVelocity(ammoVelocityForPreset(option, presetId));
    setBallisticCoefficient(option.ballisticCoefficient);
  };

  const updateBulletWeight = (value) => {
    setBulletWeightGr(value);
    setAmmo(CUSTOM_AMMO_LABEL);
  };

  const applyTab = (tab) => {
    setActiveTab(tab);
    if (tab === "rifle" && selectedPreset.family !== "rifle") {
      applyPreset("t91", "rifle");
    }
    if (tab === "pistol" && selectedPreset.family !== "pistol") {
      applyPreset("pistol4", "pistol");
    }
  };

  const relevantPresets = Object.values(PRESETS).filter((preset) =>
    activeTab === "advanced" ? true : preset.family === activeTab
  );
  const relevantAmmoOptions = AMMO_OPTIONS.filter((option) =>
    activeTab === "advanced" ? true : option.family === selectedPreset.family
  );

  return (
    <main className="app">
      <section className="tool-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">A4 公制歸零工具</p>
            <h1>歸零補償靶紙產生器</h1>
          </div>
          <button className="primary-action" type="button" onClick={() => window.print()}>
            列印 / 另存 PDF
          </button>
        </header>

        <nav className="tabs" aria-label="模式">
          {[
            ["rifle", "基礎步槍"],
            ["pistol", "基礎手槍"],
            ["advanced", "進階"]
          ].map(([id, label]) => (
            <button
              className={activeTab === id ? "active" : ""}
              key={id}
              type="button"
              onClick={() => applyTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="workspace">
          <aside className="controls" aria-label="參數設定">
            <section className="panel">
              <h2 className="heading-with-help">
                預設槍種
                <HelpTip text={HELP_TEXT.preset} />
              </h2>
              <div className="preset-grid">
                {relevantPresets.map((preset) => (
                  <button
                    className={presetId === preset.id ? "preset selected" : "preset"}
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      applyPreset(preset.id, activeTab === "advanced" ? "advanced" : preset.family)
                    }
                  >
                    <strong className="preset-title">
                      {preset.label}
                      <HelpTip focusable={false} text={preset.sightHeightNote} />
                    </strong>
                  </button>
                ))}
              </div>
            </section>

            <section className="panel">
              <h2>歸零距離</h2>
              <p className="panel-hint label-with-help">
                歸零距離快捷
                <HelpTip text={HELP_TEXT.zeroShortcut} />
              </p>
              <div className="quick-row">
                {ZERO_SHORTCUTS.map((shortcut) => (
                  <button
                    key={shortcut.label}
                    type="button"
                    onClick={() => {
                      setZeroDistance(shortcut.zero);
                    }}
                  >
                    {shortcut.label}
                  </button>
                ))}
              </div>
              <div className="field-grid">
                <label>
                  <LabelWithHelp help={HELP_TEXT.targetDistance}>靶紙距離</LabelWithHelp>
                  <input
                    min="5"
                    step="5"
                    type="number"
                    value={targetDistance}
                    onChange={(event) => setTargetDistance(event.target.value)}
                  />
                  <em>m</em>
                </label>
                <label>
                  <LabelWithHelp help={HELP_TEXT.zeroDistance}>歸零距離</LabelWithHelp>
                  <input
                    min="10"
                    step="10"
                    type="number"
                    value={zeroDistance}
                    onChange={(event) => setZeroDistance(event.target.value)}
                  />
                  <em>m</em>
                </label>
              </div>
            </section>

            <section className="panel">
              <h2>彈道</h2>
              <div className="field-grid">
                <label>
                  <LabelWithHelp help={HELP_TEXT.ammo}>彈種</LabelWithHelp>
                  <select value={ammo} onChange={(event) => applyAmmo(event.target.value)}>
                    {relevantAmmoOptions.map((option) => (
                      <option key={option.id} value={option.label}>
                        {option.label} · {ammoVelocityForPreset(option, presetId)} m/s
                      </option>
                    ))}
                    <option value={CUSTOM_AMMO_LABEL}>{CUSTOM_AMMO_LABEL}</option>
                  </select>
                </label>
                <label>
                  <LabelWithHelp help={HELP_TEXT.bulletWeight}>彈頭重量</LabelWithHelp>
                  <input
                    min="1"
                    step="1"
                    type="number"
                    value={bulletWeightGr}
                    onChange={(event) => updateBulletWeight(event.target.value)}
                  />
                  <em>gr</em>
                </label>
                <label>
                  <LabelWithHelp help={HELP_TEXT.muzzleVelocity}>初速</LabelWithHelp>
                  <input
                    min="1"
                    step="1"
                    type="number"
                    value={muzzleVelocity}
                    onChange={(event) => setMuzzleVelocity(event.target.value)}
                  />
                  <em>m/s</em>
                </label>
                <label>
                  <LabelWithHelp help={HELP_TEXT.sightHeight}>
                    瞄準高度
                  </LabelWithHelp>
                  <input
                    min="0"
                    step="0.1"
                    type="number"
                    value={sightHeight}
                    onChange={(event) => setSightHeight(event.target.value)}
                  />
                  <em>cm</em>
                </label>
                {activeTab === "advanced" && (
                  <label>
                    <LabelWithHelp help={HELP_TEXT.ballisticCoefficient}>彈道係數</LabelWithHelp>
                    <input
                      min="0.01"
                      step="0.001"
                      type="number"
                      value={ballisticCoefficient}
                      onChange={(event) => setBallisticCoefficient(event.target.value)}
                    />
                  </label>
                )}
              </div>
              <p className="panel-hint label-with-help">
                彈道模型
                <HelpTip text={HELP_TEXT.dragModel} />
              </p>
              <div className="segmented two-up">
                {["G1", "G7"].map((model) => (
                  <button
                    className={dragModel === model ? "active" : ""}
                    key={model}
                    type="button"
                    onClick={() => setDragModel(model)}
                  >
                    {model}
                  </button>
                ))}
              </div>
            </section>

            <section className="panel">
              <h2>格線與旋鈕</h2>
              <div className="field-grid">
                <label>
                  <LabelWithHelp help={HELP_TEXT.gridSize}>格線尺寸</LabelWithHelp>
                  <select value={gridCm} onChange={(event) => setGridCm(event.target.value)}>
                    <option value="0.5">0.5 cm</option>
                    <option value="1">1 cm</option>
                    <option value="2">2 cm</option>
                  </select>
                </label>
                <label>
                  <LabelWithHelp help={HELP_TEXT.clickValue}>每 Click</LabelWithHelp>
                  <input
                    min="0.001"
                    step="0.01"
                    type="number"
                    value={clickValue}
                    onChange={(event) => setClickValue(event.target.value)}
                  />
                  <em>{clickMode.toUpperCase()}</em>
                </label>
              </div>
              <p className="panel-hint label-with-help">
                旋鈕單位
                <HelpTip text={HELP_TEXT.clickMode} />
              </p>
              <div className="segmented two-up">
                {[
                  ["moa", "MOA"],
                  ["mrad", "MRAD"]
                ].map(([id, label]) => (
                  <button
                    className={clickMode === id ? "active" : ""}
                    key={id}
                    type="button"
                    onClick={() => setClickMode(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>
          </aside>

          <section className="preview-area" aria-label="靶紙預覽">
            <div className="metrics">
              <Metric label="落點偏移" value={displayOffset} />
              <Metric
                label="修正格數"
                value={`${formatSigned(ballistic.correctionGridCount, 1)} 格`}
              />
              <Metric
                label="旋鈕補正"
                value={`${Math.round(ballistic.correctionClickCount)} Clicks`}
              />
              <Metric label="1 Click" value={`${ballistic.clickCm.toFixed(2)} cm @ 靶紙距離`} />
            </div>

            <TargetSheet
              ammo={ammoDescription}
              clickCm={ballistic.clickCm}
              correctionClickCount={ballistic.correctionClickCount}
              correctionCm={ballistic.correctionCm}
              correctionGridCount={ballistic.correctionGridCount}
              gridCm={safeNumber(gridCm, 1)}
              presetLabel={selectedPreset.label}
              targetDistance={targetDistanceM}
              impactOffsetCm={ballistic.impactOffsetCm}
              zeroDistance={zeroDistanceM}
            />

            <section className="usage-notes" aria-label="使用方式">
              <h2>使用方式</h2>
              <p>先選槍枝和彈種，確認靶紙距離、歸零距離、瞄高和每 Click 數值。</p>
              <p>列印時選 A4、比例 100%，印完先量下方 5 cm 比例尺，尺寸對了再使用。</p>
              <p>射擊時瞄準中心點。紅圈是預期彈著位置，照「旋鈕補正」調整瞄具。</p>
            </section>

            <TrajectoryChart
              angle={ballistic.angle}
              ballisticCoefficient={ballisticCoefficientValue}
              bulletWeightGr={bulletWeightGr}
              chartMaxDistance={chartRangeDistance}
              chartRangeMin={chartRangeMin}
              defaultChartRange={defaultChartRange}
              dragModel={dragModel}
              muzzleVelocity={muzzleVelocityMps}
              onChartRangeChange={setChartRangeOverride}
              onChartRangeReset={() => setChartRangeOverride(null)}
              sightHeight={sightHeightCm}
              targetDistance={targetDistanceM}
              zeroDistance={zeroDistanceM}
            />

            <IPSCImpactMap
              angle={ballistic.angle}
              ammo={ammoDescription}
              ballisticCoefficient={ballisticCoefficientValue}
              dragModel={dragModel}
              muzzleVelocity={muzzleVelocityMps}
              sightHeight={sightHeightCm}
              zeroDistance={zeroDistanceM}
            />
          </section>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function TargetSheet({
  ammo,
  clickCm,
  correctionClickCount,
  correctionCm,
  correctionGridCount,
  gridCm,
  impactOffsetCm,
  presetLabel,
  targetDistance,
  zeroDistance
}) {
  const pixelsPerCm = 50;
  const cm = (value) => value * pixelsPerCm;
  const pageWidthCm = 21;
  const pageHeightCm = 29.7;
  const pageWidth = cm(pageWidthCm);
  const pageHeight = cm(pageHeightCm);
  const centerX = cm(pageWidthCm / 2);
  const centerY = cm(14.3);
  const gridStep = gridCm * pixelsPerCm;
  const gridBox = {
    height: cm(16),
    width: cm(16),
    x: centerX - cm(8),
    y: centerY - cm(8)
  };
  const verticalLines = [];
  const horizontalLines = [];
  for (let offset = 0; offset <= gridBox.width / 2 + 0.001; offset += gridStep) {
    verticalLines.push({
      major: Math.abs(offset % pixelsPerCm) < 0.01,
      x: Number((centerX + offset).toFixed(2))
    });
    if (offset > 0) {
      verticalLines.push({
        major: Math.abs(offset % pixelsPerCm) < 0.01,
        x: Number((centerX - offset).toFixed(2))
      });
    }
  }
  for (let offset = 0; offset <= gridBox.height / 2 + 0.001; offset += gridStep) {
    horizontalLines.push({
      major: Math.abs(offset % pixelsPerCm) < 0.01,
      y: Number((centerY + offset).toFixed(2))
    });
    if (offset > 0) {
      horizontalLines.push({
        major: Math.abs(offset % pixelsPerCm) < 0.01,
        y: Number((centerY - offset).toFixed(2))
      });
    }
  }

  const rawImpactY = centerY - impactOffsetCm * pixelsPerCm;
  const impactY = clamp(rawImpactY, gridBox.y + cm(0.8), gridBox.y + gridBox.height - cm(0.8));
  const impactClamped = Math.abs(rawImpactY - impactY) > 0.1;

  return (
    <div className="paper-frame">
      <svg className="target-page" viewBox={`0 0 ${pageWidth} ${pageHeight}`} role="img">
        <title>A4 歸零補償靶紙</title>
        <rect width={pageWidth} height={pageHeight} fill="#ffffff" />
        <rect
          className="grid-boundary"
          height={gridBox.height}
          width={gridBox.width}
          x={gridBox.x}
          y={gridBox.y}
        />
        {verticalLines.map((line) => (
          <line
            className={line.major ? "grid major" : "grid"}
            key={`v-${line.x}`}
            x1={line.x}
            x2={line.x}
            y1={gridBox.y}
            y2={gridBox.y + gridBox.height}
          />
        ))}
        {horizontalLines.map((line) => (
          <line
            className={line.major ? "grid major" : "grid"}
            key={`h-${line.y}`}
            x1={gridBox.x}
            x2={gridBox.x + gridBox.width}
            y1={line.y}
            y2={line.y}
          />
        ))}

        <text className="sheet-title" x={cm(1.2)} y={cm(1.6)}>
          歸零補償靶紙 A4
        </text>
        <text className="sheet-meta" x={cm(1.2)} y={cm(2.5)}>
          {presetLabel} · {ammo}
        </text>
        <text className="sheet-meta" x={cm(1.2)} y={cm(3.4)}>
          歸零 {zeroDistance} m · 靶紙距離 {targetDistance} m · 每格 {gridCm} cm · 1 Click ={" "}
          {clickCm.toFixed(2)} cm
        </text>

        <line className="axis" x1={centerX - cm(3.8)} x2={centerX + cm(3.8)} y1={centerY} y2={centerY} />
        <line className="axis" x1={centerX} x2={centerX} y1={centerY - cm(3.8)} y2={centerY + cm(3.8)} />
        <circle className="aim-ring" cx={centerX} cy={centerY} r={cm(1.8)} />
        <circle className="aim-ring inner" cx={centerX} cy={centerY} r={cm(0.7)} />
        <circle className="aim-dot" cx={centerX} cy={centerY} r={cm(0.12)} />
        <text className="point-label" x={centerX + cm(2.2)} y={centerY - cm(2)}>
          瞄準點
        </text>

        <line
          className="offset-line"
          x1={centerX}
          x2={centerX}
          y1={centerY}
          y2={impactY}
        />
        <circle
          className={impactClamped ? "impact clamped" : "impact"}
          cx={centerX}
          cy={impactY}
          r={cm(0.36)}
        />
        <line className="impact-cross" x1={centerX - cm(0.85)} x2={centerX + cm(0.85)} y1={impactY} y2={impactY} />
        <line className="impact-cross" x1={centerX} x2={centerX} y1={impactY - cm(0.85)} y2={impactY + cm(0.85)} />
        <text className="point-label strong" x={centerX + cm(0.9)} y={impactY - cm(0.35)}>
          預期落點
        </text>
        <text className="point-label" x={centerX + cm(0.9)} y={impactY + cm(0.38)}>
          {describeVerticalOffset(impactOffsetCm)}
        </text>
        {impactClamped && (
          <text className="point-label" x={centerX + cm(0.9)} y={impactY + cm(1.1)}>
            落點超出格線範圍
          </text>
        )}

        <rect className="info-box" x={cm(1.2)} y={cm(23.4)} width={cm(18.6)} height={cm(3.8)} rx={cm(0.2)} />
        <text className="sheet-meta" x={cm(1.7)} y={cm(24.3)}>
          瞄具補正：{describeCorrection(correctionCm)} ·{" "}
          {formatSigned(correctionGridCount, 1)} 格
        </text>
        <text className="sheet-meta" x={cm(1.7)} y={cm(25.1)}>
          旋鈕：約 {Math.round(correctionClickCount)} Clicks · A4 實際大小 100%
        </text>
        <text className="sheet-meta" x={cm(1.7)} y={cm(26)}>
          使用方式：歸零時瞄具瞄準中心點，紅圈是預期彈著位置。
        </text>
        <text className="sheet-meta" x={cm(1.7)} y={cm(26.8)}>
          歸零時瞄準中心點。紅圈是預期彈著位置，照「旋鈕補正」調整瞄具。
        </text>

        <line className="scale-line" x1={cm(1.7)} x2={cm(6.7)} y1={cm(28.4)} y2={cm(28.4)} />
        <line className="scale-line" x1={cm(1.7)} x2={cm(1.7)} y1={cm(28)} y2={cm(28.8)} />
        <line className="scale-line" x1={cm(6.7)} x2={cm(6.7)} y1={cm(28)} y2={cm(28.8)} />
        <text className="sheet-meta" x={cm(2.8)} y={cm(29.4)}>
          5 cm 比例尺
        </text>
      </svg>
    </div>
  );
}

function TrajectoryChart({
  angle,
  ballisticCoefficient,
  bulletWeightGr,
  chartMaxDistance,
  chartRangeMin,
  defaultChartRange,
  dragModel,
  muzzleVelocity,
  onChartRangeChange,
  onChartRangeReset,
  sightHeight,
  targetDistance,
  zeroDistance
}) {
  const chart = useMemo(() => {
    const maxDistance = Math.max(chartMaxDistance, 1);
    const sampleCount = 140;
    const samples = Array.from({ length: sampleCount }, (_, index) => {
      const distance = (maxDistance * index) / (sampleCount - 1);
      const height = trajectoryCmAt(
        distance,
        angle,
        sightHeight,
        muzzleVelocity,
        ballisticCoefficient,
        dragModel
      );
      return { distance, height };
    });
    const targetHeight = trajectoryCmAt(
      targetDistance,
      angle,
      sightHeight,
      muzzleVelocity,
      ballisticCoefficient,
      dragModel
    );
    const allHeights = [
      ...samples.map((sample) => sample.height),
      0,
      targetHeight
    ];
    const rawYMin = Math.min(-15, Math.min(...allHeights));
    const rawYMax = Math.max(20, Math.max(...allHeights));
    const yLabelStep = getYAxisStep(rawYMin, rawYMax);
    const yMinorStep = getMinorYAxisStep(yLabelStep);
    const yMin = Math.floor(rawYMin / yLabelStep) * yLabelStep;
    const yMax = Math.ceil(rawYMax / yLabelStep) * yLabelStep;
    const width = 760;
    const height = 390;
    const plot = { left: 72, right: 36, top: 24, bottom: 58 };
    const plotWidth = width - plot.left - plot.right;
    const plotHeight = height - plot.top - plot.bottom;
    const xScale = (distance) => plot.left + (distance / maxDistance) * plotWidth;
    const yScale = (pointHeight) =>
      plot.top + ((yMax - pointHeight) / (yMax - yMin)) * plotHeight;
    const path = samples
      .map((sample, index) => {
        const command = index === 0 ? "M" : "L";
        return `${command}${xScale(sample.distance).toFixed(1)},${yScale(sample.height).toFixed(1)}`;
      })
      .join(" ");
    const yFineTicks = makeTicks(yMin, yMax, yMinorStep);
    const yLabelTicks = makeTicks(yMin, yMax, yLabelStep);
    const xTickStep = maxDistance <= 150 ? 25 : maxDistance <= 400 ? 50 : 100;
    const xTicks = [];
    for (let tick = 0; tick < maxDistance; tick += xTickStep) {
      xTicks.push(tick);
    }
    xTicks.push(maxDistance);

    return {
      maxDistance,
      path,
      plot,
      target: {
        x: xScale(targetDistance),
        y: yScale(targetHeight)
      },
      width,
      height,
      xTicks,
      yFineTicks,
      yLabelTicks,
      yLabelStep,
      yScale,
      xScale,
      yMin,
      yMax,
      zero: {
        x: xScale(zeroDistance),
        y: yScale(0)
      }
    };
  }, [
    angle,
    ballisticCoefficient,
    chartMaxDistance,
    dragModel,
    muzzleVelocity,
    sightHeight,
    targetDistance,
    zeroDistance
  ]);

  return (
    <section className="chart-panel" aria-label="彈道曲線">
      <div className="chart-header">
        <h2>彈道曲線</h2>
        <span>
          高低差 {formatSigned(chart.yMin, 0)} 至 {formatSigned(chart.yMax, 0)} cm
        </span>
      </div>
      <div className="chart-range-control">
        <label>
          <span>顯示距離範圍</span>
          <input
            min={chartRangeMin}
            max="1000"
            step="5"
            type="range"
            value={chart.maxDistance}
            onChange={(event) => onChartRangeChange(Number(event.target.value))}
          />
        </label>
        <strong>{chart.maxDistance.toFixed(0)} m</strong>
        <button
          disabled={Math.abs(chart.maxDistance - defaultChartRange) < 0.5}
          type="button"
          onClick={onChartRangeReset}
        >
          預設
        </button>
      </div>
      <svg className="trajectory-chart" viewBox={`0 0 ${chart.width} ${chart.height}`} role="img">
        <title>彈道曲線預覽</title>
        {chart.yFineTicks.map((tick) => (
          <line
            className={Math.abs(tick % chart.yLabelStep) < 0.001 ? "chart-grid major" : "chart-grid"}
            key={`y-${tick}`}
            x1={chart.plot.left}
            x2={chart.width - chart.plot.right}
            y1={chart.yScale(tick)}
            y2={chart.yScale(tick)}
          />
        ))}
        {chart.xTicks.map((tick) => (
          <line
            className="chart-grid vertical"
            key={`x-${tick}`}
            x1={chart.xScale(tick)}
            x2={chart.xScale(tick)}
            y1={chart.plot.top}
            y2={chart.height - chart.plot.bottom}
          />
        ))}
        <line
          className="chart-axis"
          x1={chart.plot.left}
          x2={chart.width - chart.plot.right}
          y1={chart.yScale(0)}
          y2={chart.yScale(0)}
        />
        <line
          className="chart-axis strong"
          x1={chart.plot.left}
          x2={chart.plot.left}
          y1={chart.plot.top}
          y2={chart.height - chart.plot.bottom}
        />
        {chart.yLabelTicks.map((tick) => (
          <text className="chart-label axis-label" key={`yl-${tick}`} x={chart.plot.left - 10} y={chart.yScale(tick) + 4}>
            {formatSigned(tick, 0)} cm
          </text>
        ))}
        {chart.xTicks.map((tick) => (
          <text className="chart-label x-label" key={`xl-${tick}`} x={chart.xScale(tick)} y={chart.height - 18}>
            {tick.toFixed(0)} m
          </text>
        ))}
        <path className="trajectory-line" d={chart.path} />
        <circle className="chart-point target" cx={chart.target.x} cy={chart.target.y} r="5" />
        <circle className="chart-point zero" cx={chart.zero.x} cy={chart.zero.y} r="5" />
        <text className="chart-label" x={chart.target.x + 8} y={chart.target.y - 8}>
          靶紙距離
        </text>
        <text className="chart-label" x={chart.zero.x + 8} y={chart.zero.y + 16}>
          歸零
        </text>
      </svg>
      <div className="trajectory-stats">
        <div>
          <span>槍口初速 (m/s)</span>
          <strong>{muzzleVelocity.toFixed(0)}</strong>
        </div>
        <div>
          <span>彈頭重 (gr)</span>
          <strong>{bulletWeightGr || "未填"}</strong>
        </div>
        <div>
          <span>歸零距離</span>
          <strong>{zeroDistance.toFixed(0)} m</strong>
        </div>
      </div>
    </section>
  );
}

function IPSCImpactMap({
  angle,
  ammo,
  ballisticCoefficient,
  dragModel,
  muzzleVelocity,
  sightHeight,
  zeroDistance
}) {
  const ipsc = useMemo(
    () => {
      const labelOverlapGap = 2.6;
      const readouts = TRAJECTORY_DISTANCES.map((distance) => {
        const offsetCm = trajectoryCmAt(
          distance,
          angle,
          sightHeight,
          muzzleVelocity,
          ballisticCoefficient,
          dragModel
        );
        const aimY = 42;
        const rawY = aimY - offsetCm;
        return {
          distance,
          isVisible: rawY >= 4 && rawY <= 80,
          offsetCm,
          x: 0,
          y: rawY
        };
      });
      const visiblePoints = readouts.filter((point) => point.isVisible);
      const labelSideByDistance = new Map();

      visiblePoints.forEach((point) => {
        labelSideByDistance.set(point.distance, point.offsetCm > 0.25 ? "left" : "right");
      });

      visiblePoints
        .filter((point) => labelSideByDistance.get(point.distance) === "right")
        .sort((a, b) => a.y - b.y || a.distance - b.distance)
        .forEach((point, index, rightSidePoints) => {
          let overlappingPoint = null;
          for (let previousIndex = index - 1; previousIndex >= 0; previousIndex -= 1) {
            const previousPoint = rightSidePoints[previousIndex];
            if (Math.abs(point.y - previousPoint.y) < labelOverlapGap) {
              overlappingPoint = previousPoint;
              break;
            }
          }
          if (!overlappingPoint) {
            return;
          }
          const pointPriority = point.distance === zeroDistance ? 2 : point.distance <= 50 ? 1 : 0;
          const previousPriority =
            overlappingPoint.distance === zeroDistance ? 2 : overlappingPoint.distance <= 50 ? 1 : 0;
          const moveDistance =
            pointPriority < previousPriority ? point.distance : overlappingPoint.distance;
          labelSideByDistance.set(moveDistance, "left");
        });

      const points = visiblePoints.map((point) => ({
        ...point,
        labelSide: labelSideByDistance.get(point.distance) ?? "right"
      }));

      return {
        points,
        readouts
      };
    },
    [angle, ballisticCoefficient, dragModel, muzzleVelocity, sightHeight, zeroDistance]
  );

  return (
    <section className="ipsc-panel" aria-label="IPSC 多距離落點圖">
      <div className="chart-header">
        <div>
          <h2>IPSC 多距離落點</h2>
          <p className="panel-hint">
            {ammo} · {muzzleVelocity.toFixed(0)} m/s · {zeroDistance} m 歸零
          </p>
        </div>
        <span>25 至 500 m</span>
      </div>
      <div className="ipsc-layout">
        <svg className="ipsc-target" viewBox="-34 -6 68 92" role="img">
          <title>標準 IPSC 靶多距離落點</title>
          <polygon
            className="ipsc-body"
            points="-9,0 9,0 9,14 23,14 31,22 31,58 19,82 -19,82 -31,58 -31,22 -23,14 -9,14"
          />
          <rect className="ipsc-score" x="-6" y="4" width="12" height="7" />
          <polygon
            className="ipsc-score"
            points="-18,21 -11,14 11,14 18,21 18,62 12,72 -12,72 -18,62"
          />
          <rect className="ipsc-score" x="-12" y="24" width="24" height="34" />
          <line className="ipsc-centerline" x1="0" x2="0" y1="7" y2="76" />
          <circle className="ipsc-aim" cx="0" cy="42" r="3.1" />
          <circle className="ipsc-aim inner" cx="0" cy="42" r="1.2" />
          {ipsc.points.map((point) => (
            <g key={point.distance}>
              <circle
                className="ipsc-impact"
                cx={point.x}
                cy={point.y}
                r="1.05"
              />
              <text
                className="ipsc-label"
                dominantBaseline="middle"
                textAnchor={point.labelSide === "left" ? "end" : "start"}
                x={point.labelSide === "left" ? "-3" : "3"}
                y={point.y}
              >
                {point.distance}
              </text>
            </g>
          ))}
        </svg>
        <div className="ipsc-readout">
          {ipsc.readouts.map((point) => (
            <div className={point.isVisible ? "" : "outside"} key={point.distance}>
              <strong>{point.distance} m</strong>
              <span>
                {point.isVisible ? "" : "超出靶面 · "}
                {describeVerticalOffset(point.offsetCm)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default App;

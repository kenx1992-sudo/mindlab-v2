'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Sparkles, Users, Check, Heart, PenLine, GraduationCap, ExternalLink } from 'lucide-react';
import { getMbtiQuiz, scoreMbtiQuiz } from '@/lib/mbtiQuiz';
import { pickerT, pickerL } from '@/lib/pickerCopy';
import {
  MBTI_DISCLAIMER,
  MBTI_DISCLAIMER_EN,
  MBTI_POSSIBLE_CELEBRITIES_NOTE,
  MBTI_POSSIBLE_CELEBRITIES_NOTE_EN,
  MBTI_ORDER,
  MBTI_TYPES,
  MBTI_PLAIN_FIGURE_ID,
  VALLEY_MENTOR_REQUIRED_CRITERIA,
  VALLEY_MENTOR_SUGGESTED_CRITERIA,
  VALLEY_MENTOR_REQUIRED_CRITERIA_EN,
  VALLEY_MENTOR_SUGGESTED_CRITERIA_EN,
  displayRecLabel,
  displayRecReason,
  displayTypeText,
  getMbtiType,
  getCompanionBrowseList,
  loadCompanionChoice,
  saveCompanionChoice,
  saveUserMbtiType,
  saveCustomMbtiCompanionChoice,
  savePresetCompanionChoice,
  saveCustomCompanionChoice,
} from '@/lib/mbtiCompanions';
import { PRESET_COMPANIONS } from '@/lib/presetCompanions';
import MbtiAvatar from '@/components/MbtiAvatar';

function hasHan(s) {
  return typeof s === 'string' && /[\u4e00-\u9fff]/.test(s);
}

function TypeTitles({ type, lang }) {
  if (!type) return null;
  if (lang === 'en') {
    return (
      <span className="font-semibold text-foreground">
        {type.nameEn} <span className="text-muted-foreground font-normal text-xs">({type.code})</span>
      </span>
    );
  }
  return (
    <>
      <span className="font-semibold text-foreground">{type.nameZh}</span>
      <span className="block text-[11px] text-muted-foreground font-normal leading-snug">{type.nameEn}</span>
    </>
  );
}

function FigureTitles({ fig, lang }) {
  if (!fig) return null;
  if (lang === 'en') {
    return <span className="font-semibold text-foreground">{fig.nameEn || fig.nameZh || fig.name}</span>;
  }
  return (
    <>
      <span className="font-semibold text-foreground">{fig.nameZh || fig.name}</span>
      {fig.nameEn ? (
        <span className="block text-[11px] text-muted-foreground font-normal">{fig.nameEn}</span>
      ) : null}
    </>
  );
}

export default function MbtiCompanionPicker({
  onComplete,
  lang = 'zh-HK',
  retestUserMbtiOnly = false,
  changeCompanionOnly = false,
}) {
  const [path, setPath] = useState(null); // null | 'mbti' | 'preset' | 'custom'
  /** mbtiHub · quiz · manual · result · browse · mbtiCompanion · customMbti · mentorIntro */
  const [mode, setMode] = useState(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [userMbti, setUserMbti] = useState(null);
  const [companionMbti, setCompanionMbti] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [customName, setCustomName] = useState('');
  const [customPersonality, setCustomPersonality] = useState('');
  const [customMbtiName, setCustomMbtiName] = useState('');
  const [customMbtiPersonality, setCustomMbtiPersonality] = useState('');
  const [saveError, setSaveError] = useState('');
  const [mentorIntroPayload, setMentorIntroPayload] = useState(null); // plain | custom
  const [mentorIntroReturnMode, setMentorIntroReturnMode] = useState('mbtiCompanion');
  const [selectedFigure, setSelectedFigure] = useState(null);
  const [libraryTick, setLibraryTick] = useState(0);
  const [libraryMsg, setLibraryMsg] = useState('');

  const isEnglish = lang === 'en';
  const userType = getMbtiType(userMbti);
  const companionType = getMbtiType(companionMbti);
  const quizSteps = getMbtiQuiz(lang);
  const quizQ = quizSteps[step];
  const mbtiDisclaimer = isEnglish ? (typeof MBTI_DISCLAIMER_EN === 'string' ? MBTI_DISCLAIMER_EN : '') : MBTI_DISCLAIMER;
  const mbtiCelebNote = isEnglish
    ? (typeof MBTI_POSSIBLE_CELEBRITIES_NOTE_EN === 'string' ? MBTI_POSSIBLE_CELEBRITIES_NOTE_EN : '')
    : MBTI_POSSIBLE_CELEBRITIES_NOTE;

  useEffect(() => {
    if (retestUserMbtiOnly) {
      const c = loadCompanionChoice();
      if (c?.userMbti) setUserMbti(c.userMbti);
      setPath('mbti');
      setMode('quiz');
    } else if (changeCompanionOnly) {
      const c = loadCompanionChoice();
      if (c?.userMbti) setUserMbti(c.userMbti);
      setPath('mbti');
      setMode('browse');
    }
  }, [retestUserMbtiOnly, changeCompanionOnly]);

  function finishRetestUser(code) {
    saveUserMbtiType(code);
    const choice = loadCompanionChoice();
    if (choice) onComplete(choice);
  }

  function resetMbtiFlow() {
    setMode(null);
    setStep(0);
    setAnswers({});
    setQuizResult(null);
    setUserMbti(null);
    setCompanionMbti(null);
    setMentorIntroPayload(null);
  }

  function startMbtiHub() {
    resetMbtiFlow();
    setPath('mbti');
    setMode('mbtiHub');
  }

  function startQuiz() {
    setPath('mbti');
    setMode('quiz');
    setMentorIntroPayload(null);
    setStep(0);
    setAnswers({});
    setQuizResult(null);
    setUserMbti(null);
    setCompanionMbti(null);
  }

  function startManual() {
    setPath('mbti');
    setMode('manual');
    setMentorIntroPayload(null);
    setStep(0);
    setQuizResult(null);
    setUserMbti(null);
    setCompanionMbti(null);
  }

  function startPreset() {
    setPath('preset');
    setSelectedPreset(null);
  }

  function startCustom() {
    setPath('custom');
    setCustomName('');
    setCustomPersonality('');
  }

  function backToRoot() {
    setPath(null);
    resetMbtiFlow();
    setSelectedPreset(null);
    setCustomName('');
    setCustomPersonality('');
    setMentorIntroPayload(null);
  }

  function answerQuiz(choice) {
    const next = { ...answers, [quizQ.id]: choice };
    setAnswers(next);
    if (step < quizSteps.length - 1) {
      setStep(step + 1);
    } else {
      const { code } = scoreMbtiQuiz(next, lang);
      setQuizResult(code);
      setUserMbti(code);
      setMode('result');
      setStep(0);
    }
  }

  function confirmUserType(code) {
    if (retestUserMbtiOnly) {
      finishRetestUser(code);
      return;
    }
    setUserMbti(code);
    setCompanionMbti(null);
    setMode('browse');
  }

  function pickCompanionType(code) {
    const upper = code?.toUpperCase();
    if (!upper) return;
    if (!userMbti) setUserMbti(upper);
    setCompanionMbti(upper);
    setSelectedFigure(null);
    setSaveError('');
    setMode('mbtiCompanion');
  }

  function selectFigureForIntro(fig) {
    setSelectedFigure(fig);
  }

  function finishMbti() {
    const resolvedUser = (userMbti || companionMbti || '').trim().toUpperCase();
    if (!selectedFigure?.id || !companionMbti || !resolvedUser) {
      setSaveError(pickerT('pickTypeFirst', lang));
      return;
    }
    saveCompanionChoice(resolvedUser, companionMbti, selectedFigure.id);
    completeWithSavedChoice();
  }

  function openMentorIntro(payload, returnMode) {
    setMentorIntroPayload(payload);
    setMentorIntroReturnMode(returnMode);
    setMode('mentorIntro');
    setSaveError('');
  }

  function confirmMentorIntro() {
    const resolvedUser = (userMbti || companionMbti || '').trim().toUpperCase();
    if (!mentorIntroPayload || !companionMbti) {
      setSaveError(pickerT('pickTypeFirst', lang));
      return;
    }
    if (!resolvedUser) {
      setSaveError(pickerT('pickUserType', lang));
      return;
    }
    if (mentorIntroPayload.kind === 'plain') {
      saveCompanionChoice(resolvedUser, companionMbti, MBTI_PLAIN_FIGURE_ID);
    } else if (mentorIntroPayload.kind === 'custom' && mentorIntroPayload.customName?.trim()) {
      saveCustomMbtiCompanionChoice(
        resolvedUser,
        companionMbti,
        mentorIntroPayload.customName.trim(),
        mentorIntroPayload.customPersonality || ''
      );
    } else {
      setSaveError(pickerT('fillCustom', lang));
      return;
    }
    setMentorIntroPayload(null);
    if (!completeWithSavedChoice()) {
      setMode('mbtiCompanion');
    }
  }

  function cancelMentorIntro() {
    setMentorIntroPayload(null);
    if (mentorIntroReturnMode === 'customMbti') setMode('customMbti');
    else setMode('mbtiCompanion');
  }

  function openCustomMbtiForm() {
    setCustomMbtiName('');
    setCustomMbtiPersonality('');
    setMode('customMbti');
    setSaveError('');
  }

  function submitCustomMbtiForm() {
    const name = customMbtiName.trim();
    const personality = customMbtiPersonality.trim();
    if (!name || personality.length < 8) return;
    openMentorIntro(
      { kind: 'custom', customName: name, customPersonality: personality },
      'customMbti'
    );
  }

  function completeWithSavedChoice() {
    const choice = loadCompanionChoice();
    if (!choice) {
      setSaveError(pickerT('saveFail', lang));
      return false;
    }
    setSaveError('');
    window.dispatchEvent(new Event('mindlab-onboarding-changed'));
    onComplete(choice);
    return true;
  }

  function finishPreset() {
    if (!selectedPreset) return;
    savePresetCompanionChoice(selectedPreset.id);
    completeWithSavedChoice();
  }

  function finishCustom() {
    const name = customName.trim();
    const personality = customPersonality.trim();
    if (!name || !personality) return;
    saveCustomCompanionChoice(name, personality);
    completeWithSavedChoice();
  }

  function selectPresetAndFinish(preset) {
    setSelectedPreset(preset);
    savePresetCompanionChoice(preset.id);
    completeWithSavedChoice();
  }

  if (!path) {
    return (
      <motion.div className="fixed inset-0 z-[100] bg-background flex flex-col max-w-md mx-auto left-0 right-0 px-5 pt-12 pb-8 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs text-accent font-medium mb-2">{pickerT('hubTag', lang)}</p>
          <h2 className="font-playfair text-2xl font-bold text-foreground mb-3">{pickerT('hubTitle', lang)}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-8">{pickerT('hubIntro', lang)}</p>
          <button
            type="button"
            onClick={startMbtiHub}
            className="w-full mb-3 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 calm-glow-ring"
          >
            <GraduationCap className="w-4 h-4" /> {pickerT('mbtiMode', lang)}
          </button>
          <button
            type="button"
            onClick={startPreset}
            className="w-full mb-3 py-4 rounded-2xl border border-border/80 text-foreground font-medium text-sm flex items-center justify-center gap-2"
          >
            <Heart className="w-4 h-4" /> {pickerT('presetMode', lang)}
          </button>
          <button
            type="button"
            onClick={startCustom}
            className="w-full py-4 rounded-2xl border border-border/80 text-foreground font-medium text-sm flex items-center justify-center gap-2"
          >
            <PenLine className="w-4 h-4" /> {pickerT('customMode', lang)}
          </button>
        <p className="text-[10px] text-muted-foreground mt-6 leading-relaxed text-center">{mbtiDisclaimer}</p>
        </motion.div>
      </motion.div>
    );
  }

  if (path === 'preset') {
    return (
      <motion.div className="fixed inset-0 z-[100] bg-background flex flex-col max-w-md mx-auto px-5 pt-10 pb-8 overflow-y-auto">
        <button type="button" onClick={backToRoot} className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
          <ChevronLeft className="w-3.5 h-3.5" /> {pickerT('back', lang)}
        </button>
        <p className="text-xs text-accent font-medium mb-1">{pickerT('presetMode', lang)}</p>
        <h3 className="font-playfair text-xl font-semibold mb-1">{pickerT('presetPick', lang)}</h3>
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{pickerT('presetModeDesc', lang)}</p>
        {saveError && (
          <p className="text-xs text-destructive mb-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2">
            {saveError}
          </p>
        )}
        <motion.div className="space-y-3 mb-6">
          {PRESET_COMPANIONS.map((preset) => {
            const picked = selectedPreset?.id === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => selectPresetAndFinish(preset)}
                className={`w-full text-left p-4 rounded-2xl calm-card transition-all ${
                  picked ? 'ring-2 ring-primary' : 'hover:border-primary/30'
                }`}
              >
                <motion.div layout className="flex items-start justify-between gap-2">
                  <motion.div layout className="min-w-0">
                    <p className="font-semibold text-foreground">{isEnglish ? preset.nameEn || preset.name : preset.name}</p>
                    <p className="text-xs text-primary mt-0.5">{isEnglish ? preset.taglineEn || preset.tagline : preset.tagline}</p>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{isEnglish ? preset.descriptionEn || preset.description : preset.description}</p>
                  </motion.div>
                  {picked && <Check className="w-5 h-5 text-primary shrink-0" />}
                </motion.div>
              </button>
            );
          })}
        </motion.div>
        <p className="text-[10px] text-muted-foreground text-center">{pickerT('presetPickHint', lang)}</p>
      </motion.div>
    );
  }

  if (path === 'custom') {
    const canFinish = customName.trim().length > 0 && customPersonality.trim().length >= 8;
    return (
      <motion.div className="fixed inset-0 z-[100] bg-background flex flex-col max-w-md mx-auto px-5 pt-10 pb-8 overflow-y-auto">
        <button type="button" onClick={backToRoot} className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
          <ChevronLeft className="w-3.5 h-3.5" /> {pickerT('back', lang)}
        </button>
        <p className="text-xs text-accent font-medium mb-1">{pickerT('customPickTitle', lang)}</p>
        <h3 className="font-playfair text-xl font-semibold mb-1">{pickerT('customCreateTitle', lang)}</h3>
        <p className="text-xs text-muted-foreground mb-6 leading-relaxed">{pickerT('customCreateDesc', lang)}</p>
        <label className="block mb-4">
          <span className="text-xs font-medium text-foreground">{pickerT('customNameLabel', lang)}</span>
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder={pickerT('namePh', lang)}
            maxLength={24}
            className="mt-1.5 w-full rounded-2xl border border-border/80 bg-background/80 px-4 py-3 text-sm outline-none focus:border-primary/60"
          />
        </label>
        <label className="block mb-2">
          <span className="text-xs font-medium text-foreground">{pickerT('customStyleLabel', lang)}</span>
          <textarea
            value={customPersonality}
            onChange={(e) => setCustomPersonality(e.target.value)}
            placeholder={pickerT('customStylePh', lang)}
            rows={5}
            maxLength={400}
            className="mt-1.5 w-full rounded-2xl border border-border/80 bg-background/80 px-4 py-3 text-sm outline-none focus:border-primary/60 resize-none leading-relaxed"
          />
        </label>
        <p className="text-[10px] text-muted-foreground mb-6">{pickerT('minChars', lang)}</p>
        <button
          type="button"
          disabled={!canFinish}
          onClick={finishCustom}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-40"
        >
          {pickerT('startChat', lang)}
        </button>
      </motion.div>
    );
  }

  if (path === 'mbti' && mode === 'mbtiHub') {
    return (
      <motion.div className="fixed inset-0 z-[100] bg-background flex flex-col max-w-md mx-auto left-0 right-0 px-5 pt-12 pb-8 overflow-y-auto">
        <button type="button" onClick={backToRoot} className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
          <ChevronLeft className="w-3.5 h-3.5" /> {pickerT('back', lang)}
        </button>
        <p className="text-xs text-accent font-medium mb-2">{pickerT('mbtiMode', lang)}</p>
        <h2 className="font-playfair text-2xl font-bold text-foreground mb-3">{pickerT('mbtiMode', lang)}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-8">
          {pickerT('mbtiHubDesc', lang)}
        </p>
        <button
          type="button"
          onClick={startQuiz}
          className="w-full mb-3 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 calm-glow-ring"
        >
          <Sparkles className="w-4 h-4" /> {pickerT('quizBtn', lang)}
        </button>
        <button
          type="button"
          onClick={startManual}
          className="w-full py-4 rounded-2xl border border-border/80 text-foreground font-medium text-sm flex items-center justify-center gap-2"
        >
          <Users className="w-4 h-4" /> {pickerT('manualBtn', lang)}
        </button>
      </motion.div>
    );
  }

  if (mode === 'quiz' && quizQ) {
    return (
      <motion.div className="fixed inset-0 z-[100] bg-background flex flex-col max-w-md mx-auto px-5 pt-10 pb-8">
        <button type="button" onClick={() => setMode('mbtiHub')} className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
          <ChevronLeft className="w-3.5 h-3.5" /> {pickerT('back', lang)}
        </button>
        <div className="flex gap-1 mb-6">
          {quizSteps.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-border'}`} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mb-2">{step + 1} / {quizSteps.length}</p>
        <AnimatePresence mode="wait">
          <motion.div
            key={quizQ.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            className="flex-1 flex flex-col"
          >
            <h3 className="font-playfair text-xl font-semibold text-foreground mb-6 leading-snug">{quizQ.text}</h3>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => answerQuiz('a')}
                className="w-full text-left p-4 rounded-2xl calm-card hover:border-primary/40 transition-colors text-sm"
              >
                {quizQ.a.label}
              </button>
              <button
                type="button"
                onClick={() => answerQuiz('b')}
                className="w-full text-left p-4 rounded-2xl calm-card hover:border-primary/40 transition-colors text-sm"
              >
                {quizQ.b.label}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
        {step > 0 && (
          <button type="button" onClick={() => setStep(step - 1)} className="mt-4 text-xs text-muted-foreground flex items-center gap-1">
            <ChevronLeft className="w-3.5 h-3.5" /> {pickerT('prevQuestion', lang)}
          </button>
        )}
      </motion.div>
    );
  }

  if (mode === 'manual') {
    return (
      <motion.div className="fixed inset-0 z-[100] bg-background flex flex-col max-w-md mx-auto px-5 pt-10 pb-8 overflow-y-auto">
        <button type="button" onClick={() => setMode('mbtiHub')} className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
          <ChevronLeft className="w-3.5 h-3.5" /> {pickerT('back', lang)}
        </button>
        <h3 className="font-playfair text-xl font-semibold mb-2">{pickerT('manualTitle', lang)}</h3>
        <p className="text-xs text-muted-foreground mb-4">{pickerT('manualDesc', lang)}</p>
        <div className="grid grid-cols-2 gap-2 pb-4">
          {MBTI_ORDER.map((code) => {
            const t = MBTI_TYPES[code];
            return (
              <button
                key={code}
                type="button"
                onClick={() => confirmUserType(code)}
                className="text-left p-3 rounded-xl calm-card hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <MbtiAvatar code={code} sizeClass="w-10 h-10" iconClass="w-[18px] h-[22px]" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-primary text-xs">{code}</p>
                    <div className="text-xs text-foreground font-medium leading-snug mt-0.5">
                      <TypeTitles type={t} lang={lang} />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{displayTypeText(t, 'tagline', lang)}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>
    );
  }

  if (mode === 'result') {
    const suggested = getMbtiType(quizResult);
    return (
      <motion.div className="fixed inset-0 z-[100] bg-background flex flex-col max-w-md mx-auto px-5 pt-10 pb-8 overflow-y-auto">
        <button type="button" onClick={() => setMode('mbtiHub')} className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
          <ChevronLeft className="w-3.5 h-3.5" /> {pickerT('backMbti', lang)}
        </button>
        <h3 className="font-playfair text-xl font-semibold mb-2">{pickerT('quizResult', lang)}</h3>
        <p className="text-sm text-muted-foreground mb-6">{pickerT('quizResultDesc', lang)}</p>
        {suggested && (
          <button
            type="button"
            onClick={() => confirmUserType(quizResult)}
            className="w-full text-left p-5 rounded-2xl calm-card ring-2 ring-primary mb-4"
          >
            <div className="flex gap-4">
              {suggested && <MbtiAvatar code={quizResult} />}
              <div className="min-w-0">
                <p className="text-2xl font-bold text-primary">{quizResult}</p>
                <div className="font-semibold text-foreground mt-1">
                  {suggested && <TypeTitles type={suggested} lang={lang} />}
                </div>
                <p className="text-xs text-muted-foreground mt-2">{displayTypeText(suggested, 'tagline', lang)}</p>
              </div>
            </div>
            <p className="text-xs text-primary mt-3 flex items-center gap-1">
              {pickerT('confirmMyType', lang)} <ChevronRight className="w-3.5 h-3.5" />
            </p>
          </button>
        )}
        <p className="text-xs text-muted-foreground mb-2">{pickerT('orOtherTypes', lang)}</p>
        <motion.div className="grid grid-cols-4 gap-2 pb-6">
          {MBTI_ORDER.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => confirmUserType(code)}
              className={`py-2 rounded-lg text-xs font-semibold border ${
                code === quizResult ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'
              }`}
            >
              {code}
            </button>
          ))}
        </motion.div>
      </motion.div>
    );
  }

  if (mode === 'browse' && userType) {
    const browseList = getCompanionBrowseList(userMbti);
    const recommended = browseList.filter((item) => item.recommended);
    return (
      <motion.div className="fixed inset-0 z-[100] bg-background flex flex-col max-w-md mx-auto">
        <div className="flex-1 overflow-y-auto px-5 pt-10 pb-4">
        <button
          type="button"
          onClick={() => setMode(quizResult ? 'result' : 'manual')}
          className="text-xs text-muted-foreground mb-4 flex items-center gap-1"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> {pickerT('changeYourType', lang)}
        </button>
        <p className="text-xs text-muted-foreground mb-1">
          {pickerT('yourTypeLine', lang)}
          <span className="text-primary font-bold">{userMbti}</span>
          {' · '}
          {isEnglish ? userType.nameEn : userType.nameZh}
        </p>
        <h3 className="font-playfair text-xl font-semibold mb-1">{pickerT('pickCompanionTitle', lang)}</h3>
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{pickerT('pickCompanionDesc', lang)}</p>
        {saveError && (
          <p className="text-xs text-destructive mb-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2">
            {saveError}
          </p>
        )}
        {recommended.length > 0 && (
          <>
            <p className="text-xs font-medium text-accent mb-2">{pickerT('recommendedForYou', lang)}</p>
            <div className="space-y-2 mb-5">
              {recommended.map((item) => {
                const t = MBTI_TYPES[item.code];
                if (!t) return null;
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => pickCompanionType(item.code)}
                    className="w-full text-left p-4 rounded-2xl calm-card ring-1 ring-accent/40 hover:border-primary/40 transition-colors"
                  >
                    <motion.div layout className="flex items-start justify-between gap-2">
                      <div className="flex gap-3 min-w-0">
                        <MbtiAvatar code={item.code} sizeClass="w-11 h-11" iconClass="w-5 h-6" />
                        <motion.div layout className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-primary text-sm">{item.code}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent font-medium">
                              {displayRecLabel(item, lang)}
                            </span>
                          </div>
                          <div className="text-xs text-foreground font-medium mt-0.5">
                            <TypeTitles type={t} lang={lang} />
                          </div>
                          {displayRecReason(item, lang) ? (
                              <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{displayRecReason(item, lang)}</p>
                            ) : null}
                        </motion.div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                    </motion.div>
                  </button>
                );
              })}
            </div>
          </>
        )}
        <p className="text-xs font-medium text-foreground mb-2">{pickerT('all16Types', lang)}</p>
        <div className="grid grid-cols-2 gap-2 pb-4">
          {MBTI_ORDER.map((code) => {
            const t = MBTI_TYPES[code];
            const rec = recommended.find((r) => r.code === code);
            return (
              <button
                key={code}
                type="button"
                onClick={() => pickCompanionType(code)}
                className={`text-left p-3 rounded-xl calm-card hover:border-primary/40 transition-colors ${
                  code === userMbti ? 'border-primary/30' : ''
                }`}
              >
                <div className="flex gap-2.5 items-start">
                  <MbtiAvatar code={code} sizeClass="w-10 h-10" iconClass="w-[18px] h-[22px]" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-bold text-primary text-xs">{code}</p>
                      {rec && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent/15 text-accent">{displayRecLabel(rec, lang)}</span>
                      )}
                      {code === userMbti && (
                        <span className="text-[9px] text-muted-foreground">{pickerT('youBadge', lang)}</span>
                      )}
                    </div>
                    <div className="text-xs text-foreground font-medium mt-0.5">
                      <TypeTitles type={t} lang={lang} />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{displayTypeText(t, 'tagline', lang)}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        </div>
        <div className="shrink-0 px-5 pt-3 pb-8 border-t border-border/60 bg-background/95 backdrop-blur-md">
          <button
            type="button"
            onClick={() => pickCompanionType(userMbti)}
            className="w-full py-3.5 rounded-2xl border border-primary/40 text-primary font-medium text-sm"
          >
            {isEnglish ? `Continue as ${userMbti} →` : `${pickerT('continueType', lang)}（${userMbti}）→`}
          </button>
          <p className="text-[10px] text-muted-foreground text-center mt-2">{pickerT('orPick', lang)}</p>
        </div>
      </motion.div>
    );
  }

  if (mode === 'mbtiCompanion' && companionType) {
    return (
      <motion.div className="fixed inset-0 z-[100] bg-background flex flex-col max-w-md mx-auto">
        <motion.div className="flex-1 overflow-y-auto px-5 pt-10 pb-4">
        <button type="button" onClick={() => setMode('browse')} className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
          <ChevronLeft className="w-3.5 h-3.5" /> {pickerT('changeType', lang)}
        </button>
        {userMbti && userMbti !== companionMbti && (
          <p className="text-[10px] text-muted-foreground mb-3">
            {pickerT('companionTemperamentNote', lang)}
            <span className="text-primary font-medium">{userMbti}</span>
            {pickerT('companionTemperamentAs', lang)}
            <span className="text-primary font-medium">{companionMbti}</span>
            {pickerT('companionTemperamentSuffix', lang)}
          </p>
        )}
        <div className="flex gap-3 items-center mb-4">
          <MbtiAvatar code={companionMbti} />
          <div>
            <p className="text-xs text-accent font-medium">{pickerT('mbtiCompanion', lang)}</p>
            <div className="font-playfair text-lg font-semibold text-foreground">
              <TypeTitles type={companionType} lang={lang} />
            </div>
            <p className="text-[11px] text-primary font-bold mt-0.5">{companionMbti}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-5 leading-relaxed">{displayTypeText(companionType, 'tone', lang)}</p>
        <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
          {isEnglish
            ? `Chat in the ${companionType.nameEn} (${companionMbti}) ${pickerT('chatTonePlain', lang)}`
            : `用 ${companionMbti}（${companionType.nameZh}）${pickerT('chatTonePlain', lang)}`}
        </p>
        <h4 className="text-sm font-semibold text-foreground mt-4 mb-1">
          {pickerT('celebritiesNote', lang)} {companionMbti}{isEnglish ? pickerT('celebritiesSuffix', lang) : ` ${pickerT('celebritiesSuffix', lang)}`}
        </h4>
        <p className="text-[10px] text-muted-foreground mb-3 leading-relaxed">{mbtiCelebNote}</p>
        <motion.div className="space-y-2 mb-4">
          {companionType.figures.map((fig) => (
            <motion.div key={fig.id} className="p-3.5 rounded-2xl calm-card border border-border/50">
              <div className="flex items-start gap-3">
                <MbtiAvatar code={companionMbti} sizeClass="w-10 h-10" iconClass="w-5 h-5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <FigureTitles fig={fig} lang={lang} />
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                    {isEnglish ? pickerT('figureCardEn', lang) : fig.hint}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
        <p className="text-[10px] text-muted-foreground leading-relaxed mb-2">{mbtiDisclaimer}</p>
        <button
          type="button"
          onClick={openCustomMbtiForm}
          className="w-full text-center text-xs text-primary py-2 hover:underline mb-2"
        >
          {pickerT('customPersona', lang)}
        </button>
        </motion.div>
        <motion.div className="shrink-0 px-5 pt-3 pb-8 border-t border-border/60 bg-background/95 backdrop-blur-md">
          <button
            type="button"
            onClick={() => openMentorIntro({ kind: 'plain' }, 'mbtiCompanion')}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm calm-glow-ring"
          >
            {pickerT('startBriefing', lang)}
          </button>
        </motion.div>
      </motion.div>
    );
  }

  if (mode === 'customMbti' && companionType) {
    const canSubmit =
      customMbtiName.trim().length > 0 && customMbtiPersonality.trim().length >= 8;
    return (
      <motion.div className="fixed inset-0 z-[100] h-[100dvh] bg-background flex flex-col max-w-md mx-auto">
        <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-10 pb-4">
        <button type="button" onClick={() => setMode('mbtiCompanion')} className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
          <ChevronLeft className="w-3.5 h-3.5" /> {pickerT('backCompanion', lang)}
        </button>
        <p className="text-xs text-accent font-medium mb-1">
          {pickerT('customTitle', lang)}
        </p>
        <h3 className="font-playfair text-xl font-semibold mb-1">
          {pickerT('customSubtitle', lang)}
        </h3>
        <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
          {pickerL(
            lang,
            '下面揀嘅類型決定語氣底蘊；性格欄可寫你想點傾。可上 Personality Database 搵靈感，但 AI 唔會扮演該真人或角色。',
            '下面選的類型決定語氣底蘊；性格欄可寫你想怎麼聊。可上 Personality Database 找靈感，但 AI 不會扮演該真人或角色。',
            'Base tone follows the MBTI you pick below. Add traits you want — optional PDB lookup for inspiration only.'
          )}
        </p>
        <label className="block mb-4">
          <span className="text-xs font-medium text-foreground">
            {pickerT('nameLabel', lang)}
          </span>
          <input
            type="text"
            value={customMbtiName}
            onChange={(e) => setCustomMbtiName(e.target.value)}
            placeholder={pickerT('namePh', lang)}
            maxLength={24}
            className="mt-1.5 w-full rounded-2xl border border-border/80 bg-background/80 px-4 py-3 text-sm outline-none focus:border-primary/60"
          />
        </label>
        <label className="block mb-4">
          <span className="text-xs font-medium text-foreground">
            {pickerT('toneLabel', lang)}
          </span>
          <select
            value={companionMbti || ''}
            onChange={(e) => setCompanionMbti(e.target.value)}
            className="mt-1.5 w-full rounded-2xl border border-border/80 bg-background/80 px-4 py-3 text-sm outline-none focus:border-primary/60"
          >
            {MBTI_ORDER.map((code) => (
              <option key={code} value={code}>
                {code} · {MBTI_TYPES[code]?.nameZh} / {MBTI_TYPES[code]?.nameEn}
              </option>
            ))}
          </select>
        </label>
        <label className="block mb-2">
          <span className="text-xs font-medium text-foreground">
            {pickerT('styleLabel', lang)}
          </span>
          <textarea
            value={customMbtiPersonality}
            onChange={(e) => setCustomMbtiPersonality(e.target.value)}
            placeholder={pickerL(
              lang,
              '例如：語氣慢啲、少連環問、像某角色咁溫柔但唔扮佢…',
              '例如：語氣慢一點、少連環問、像某角色般溫柔但不扮演他…',
              'e.g. gentle, fewer questions in a row, INFJ-like depth…'
            )}
            rows={5}
            maxLength={400}
            className="mt-1.5 w-full rounded-2xl border border-border/80 bg-background/80 px-4 py-3 text-sm outline-none focus:border-primary/60 resize-none leading-relaxed"
          />
        </label>
        <p className="text-[10px] text-muted-foreground mb-3">
          {pickerT('minChars', lang)}
        </p>
        <a
          href="https://www.personality-database.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-primary mb-6 hover:underline"
        >
          Personality Database <ExternalLink className="w-3 h-3" />
        </a>
        </div>
        <div className="shrink-0 px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t border-border/60 bg-background/95 backdrop-blur-md">
          <button
            type="button"
            disabled={!canSubmit}
            onClick={submitCustomMbtiForm}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-40"
          >
            {pickerT('mentorContinue', lang)}
          </button>
        </div>
      </motion.div>
    );
  }

  if (mode === 'browse' && userMbti && !userType) {
    return (
      <motion.div className="fixed inset-0 z-[100] bg-background flex flex-col max-w-md mx-auto px-5 pt-10 pb-8">
        <p className="text-sm text-destructive mb-4">{pickerT('reloadType', lang)}</p>
        <button type="button" onClick={() => setMode('manual')} className="py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-medium">
          {pickerT('repickType', lang)}
        </button>
      </motion.div>
    );
  }

  if (mode === 'figure' && companionType) {
    return (
      <motion.div className="fixed inset-0 z-[100] bg-background flex flex-col max-w-md mx-auto">
        <div className="flex-1 overflow-y-auto px-5 pt-10 pb-4">
        <button type="button" onClick={() => setMode('stylePick')} className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
          <ChevronLeft className="w-3.5 h-3.5" /> {pickerT('changeStyle', lang)}
        </button>
        {userMbti && userMbti !== companionMbti && (
          <p className="text-[10px] text-muted-foreground mb-2">
            {pickerT('userCompanionNote', lang)}
            <span className="text-primary font-medium">{userMbti}</span>
            {pickerT('companionStyleFrom', lang)}
            <span className="text-primary font-medium">{companionMbti}</span>
          </p>
        )}
        <div className="flex gap-2 items-start mt-2">
          <MbtiAvatar code={companionMbti} />
          <div>
            <p className="text-xs text-primary font-bold">{companionMbti}</p>
            <div className="text-sm font-medium text-foreground">
              <TypeTitles type={companionType} lang={lang} />
            </div>
          </div>
        </div>
        <h3 className="font-playfair text-xl font-semibold mb-1 mt-1">{pickerT('figurePickTitle', lang)}</h3>
        <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{displayTypeText(companionType, 'tone', lang)}</p>
        <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 mb-3 text-[10px] text-muted-foreground leading-relaxed">
          <p className="font-medium text-foreground/90 mb-1">{pickerT('selectCriteria', lang)}</p>
          <ul className="list-disc pl-4 space-y-0.5 mb-2">
            {(isEnglish ? VALLEY_MENTOR_REQUIRED_CRITERIA_EN : VALLEY_MENTOR_REQUIRED_CRITERIA).map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <p className="font-medium text-foreground/90 mb-1">{pickerT('selectPreferred', lang)}</p>
          <ul className="list-disc pl-4 space-y-0.5">
            {(isEnglish ? VALLEY_MENTOR_SUGGESTED_CRITERIA_EN : VALLEY_MENTOR_SUGGESTED_CRITERIA).slice(0, 3).map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
        <p className="text-[11px] text-accent/90 mb-4">{pickerT('figurePickNote', lang)}</p>
        {saveError && (
          <p className="text-xs text-destructive mb-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2">
            {saveError}
          </p>
        )}
        <div className="space-y-3 mb-4">
          {companionType.figures.map((fig) => {
            const picked = selectedFigure?.id === fig.id;
            return (
              <button
                key={fig.id}
                type="button"
                onClick={() => selectFigureForIntro(fig)}
                className={`w-full text-left p-4 rounded-2xl calm-card transition-all ${
                  picked ? 'ring-2 ring-primary' : 'hover:border-primary/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <MbtiAvatar code={companionMbti} sizeClass="w-11 h-11" iconClass="w-5 h-6 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <FigureTitles fig={fig} lang={lang} />
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      {isEnglish ? pickerT('figureCardEn', lang) : fig.hint}
                    </p>
                    {!isEnglish && fig.lows?.length > 0 && (
                      <p className="text-[10px] text-muted-foreground/80 mt-2 leading-relaxed">
                        <span className="text-accent/90">{pickerT('lowsLabel', lang)}</span>
                        {fig.lows.slice(0, 2).join(' · ')}
                      </p>
                    )}
                  </div>
                  {picked && <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />}
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground leading-relaxed">{mbtiDisclaimer}</p>
        </div>
        <motion.div className="shrink-0 px-5 pt-3 pb-8 border-t border-border/60 bg-background/95 backdrop-blur-md">
          <button
            type="button"
            disabled={!selectedFigure}
            onClick={finishMbti}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-40"
          >
            {selectedFigure
              ? isEnglish
                ? `${pickerT('figureBriefingWith', lang)}${selectedFigure.nameEn || selectedFigure.name}`
                : `${pickerT('figureBriefingWith', lang)}${selectedFigure.nameZh || selectedFigure.name}${pickerT('figureBriefingSuffix', lang)}`
              : pickerT('pickFigureFirst', lang)}
          </button>
        </motion.div>
      </motion.div>
    );
  }

  if (mode === 'mentorIntro') {
    const isPlain = mentorIntroPayload?.kind === 'plain';
    const isCustom = mentorIntroPayload?.kind === 'custom';
    return (
      <motion.div className="fixed inset-0 z-[100] h-[100dvh] bg-background flex flex-col max-w-md mx-auto">
        <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-10 pb-4">
        <button type="button" onClick={cancelMentorIntro} className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
          <ChevronLeft className="w-3.5 h-3.5" /> {pickerT('backEdit', lang)}
        </button>
        {saveError && (
          <p className="text-xs text-destructive mb-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2">
            {saveError}
          </p>
        )}
        <div className="flex justify-center mb-4">
          <MbtiAvatar code={companionMbti} sizeClass="w-16 h-16" iconClass="w-8 h-10" />
        </div>
        <h3 className="font-playfair text-xl font-semibold text-center mb-2">
          {pickerT('introTitle', lang)}
        </h3>
        <div className="space-y-3 text-xs text-muted-foreground leading-relaxed mb-6">
          {isEnglish ? (
            <>
              <p>
                You are about to chat with an <strong className="text-foreground">AI companion styled as an MBTI mentor</strong>
                — not a licensed therapist and not a real person.
              </p>
              <p>
                {isPlain
                  ? `Mode: ${companionMbti} (${companionType?.nameEn}) MBTI companion — not a celebrity or real person.`
                  : `Mode: your persona "${mentorIntroPayload.customName}" with ${companionMbti} (${companionType?.nameEn}) tone — not a real person.`}
              </p>
              <p>Keep expectations realistic: this is emotional support conversation, not diagnosis or treatment.</p>
            </>
          ) : (
            <>
              <p>
                即將開始嘅係 <strong className="text-foreground">MBTI 陪伴</strong>
                ：用嚟慢慢傾心情、理清感受，並<strong className="text-foreground">唔係真人</strong>
                ，亦<strong className="text-foreground">唔係心理治療或醫療服務</strong>。
              </p>
              <p>
                {isPlain
                  ? <>你揀嘅係「MBTI 陪伴者」——用 {companionMbti}（{companionType?.nameZh}／{companionType?.nameEn}）類型語氣陪你；名人清單只係類型參考，對話唔扮演任何人。</>
                  : <>
                      你揀嘅係「自訂人格」——<strong className="text-foreground">{mentorIntroPayload.customName}</strong>，以{' '}
                      {companionMbti}（{companionType?.nameZh}）語氣為底，按你寫嘅性格傾偈；<strong className="text-foreground">唔扮演</strong>
                      任何真人、明星或虛構角色本人。
                    </>}
              </p>
              <p>若你正經歷危急情緒或自傷念頭，請聯絡當地的緊急支援熱線；此功能替代唔到專業協助。</p>
            </>
          )}
        </div>
        </div>
        <div className="shrink-0 px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t border-border/60 bg-background/95 backdrop-blur-md">
          <button
            type="button"
            onClick={confirmMentorIntro}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm calm-glow-ring"
          >
            {pickerT('introAgree', lang)}
          </button>
        </div>
      </motion.div>
    );
  }

  return null;
}

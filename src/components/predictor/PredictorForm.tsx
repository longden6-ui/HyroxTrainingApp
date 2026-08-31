'use client';

import { useState, useEffect, useRef } from 'react';
import { createPrediction } from '@/src/lib/actions/predict';
import { validatePredictorInput } from '@/src/lib/predictor/schema';
import { estimateFinishTime } from '@/src/lib/predictor/estimator';
import { PredictorResult } from './PredictorResult';
import styles from './form.module.css';

interface FormState {
  loading: boolean;
  errors: Record<string, string>;
  result?: any;
  liveEstimate?: any;
}

export function PredictorForm() {
  const [state, setState] = useState<FormState>({
    loading: false,
    errors: {},
  });
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState({
    age: 35,
    category: 'INDIVIDUAL' as const,
    division: 'MEN_INDIVIDUAL_OPEN' as const,
    fiveKmTimeMinutes: 25,
    fiveKmTimeSeconds: 0,
    fiveKmRecency: 'RECENT' as const,
    weightValue: 80,
    weightUnit: 'kg' as const,
    competitionDateDays: 30,
    targetTimeMinutes: '',
    targetTimeSeconds: '',
    priorHyroxResult: 'NO_PRIOR_RESULT' as const,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'age' || name.includes('Days') || name.includes('Value')
        ? parseInt(value, 10) || 0
        : value,
    }));

    setState((prev) => ({
      ...prev,
      errors: {
        ...prev.errors,
        [name]: '',
      },
    }));

    // Live recalculation on input change [T-10]
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      setFormData((currentData) => {
        const competitionDate = new Date();
        competitionDate.setDate(competitionDate.getDate() + currentData.competitionDateDays);

        const fiveKmTimeSeconds = currentData.fiveKmTimeMinutes * 60 + currentData.fiveKmTimeSeconds;

        const input = {
          age: currentData.age,
          category: currentData.category,
          division: currentData.division,
          fiveKmTimeSeconds,
          fiveKmRecency: currentData.fiveKmRecency,
          weightValue: currentData.weightValue,
          weightUnit: currentData.weightUnit,
          competitionDate: competitionDate.toISOString(),
          targetFinishTimeSeconds: currentData.targetTimeMinutes || currentData.targetTimeSeconds
            ? parseInt(currentData.targetTimeMinutes || '0', 10) * 60 +
              parseInt(currentData.targetTimeSeconds || '0', 10)
            : undefined,
          priorHyroxResult: currentData.priorHyroxResult,
        };

        // Validate input
        const validation = validatePredictorInput(input);
        if (validation.valid && validation.data) {
          try {
            // Run estimator live [T-10]
            const estimate = estimateFinishTime(validation.data);
            setState((prev) => ({
              ...prev,
              liveEstimate: {
                lowSeconds: estimate.lowSeconds,
                highSeconds: estimate.highSeconds,
                confidence: estimate.confidence,
                drivers: estimate.drivers,
                dataQualityWarnings: estimate.dataQualityWarnings,
                goalGapLabel: estimate.goalGapLabel,
              },
            }));
          } catch (err) {
            // Silent fail for live estimation
          }
        }

        return currentData;
      });
    }, 500); // Debounce 500ms
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState({ loading: true, errors: {} });

    try {
      const competitionDate = new Date();
      competitionDate.setDate(competitionDate.getDate() + formData.competitionDateDays);

      const targetFinishTimeSeconds =
        formData.targetTimeMinutes || formData.targetTimeSeconds
          ? parseInt(formData.targetTimeMinutes || '0', 10) * 60 +
            parseInt(formData.targetTimeSeconds || '0', 10)
          : undefined;

      const fiveKmTimeSeconds = formData.fiveKmTimeMinutes * 60 + formData.fiveKmTimeSeconds;

      const input = {
        age: formData.age,
        category: formData.category,
        division: formData.division,
        fiveKmTimeSeconds,
        fiveKmRecency: formData.fiveKmRecency,
        weightValue: formData.weightValue,
        weightUnit: formData.weightUnit,
        competitionDate: competitionDate.toISOString(),
        targetFinishTimeSeconds,
        priorHyroxResult: formData.priorHyroxResult,
      };

      const response = await createPrediction(input);

      if (!response.success) {
        setState({
          loading: false,
          errors: response.errors || { _form: 'An error occurred' },
        });
      } else {
        setState({
          loading: false,
          errors: {},
          result: response.prediction,
        });
      }
    } catch (error) {
      setState({
        loading: false,
        errors: { _form: 'An unexpected error occurred' },
      });
    }
  };

  if (state.result) {
    return <PredictorResult result={state.result} onReset={() => setState({ loading: false, errors: {} })} />;
  }

  return (
    <div className={styles.predictor_form}>
      <h1>HYROX Time Predictor</h1>
      <p className={styles.subtitle}>
        Get an estimated finish-time range based on your running fitness and event details.
      </p>

      <form className={styles.form} onSubmit={handleSubmit}>
        {state.errors._form && (
          <div className={styles.error_banner} role="alert">
            {state.errors._form}
          </div>
        )}

        <fieldset className={styles.fieldset}>
          <label htmlFor="age" className={styles.label}>Age *</label>
          <input
            type="number"
            id="age"
            name="age"
            value={formData.age}
            onChange={handleInputChange}
            min="16"
            max="120"
            required
            className={styles.input}
            aria-invalid={!!state.errors.age}
            aria-describedby={state.errors.age ? 'age-error' : undefined}
          />
          {state.errors.age && (
            <span id="age-error" className={styles.error_message}>
              {state.errors.age}
            </span>
          )}
        </fieldset>

        <div className={styles.form_row}>
          <fieldset className={styles.fieldset}>
            <label htmlFor="category" className={styles.label}>Category *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              className={styles.select}
            >
              <option value="INDIVIDUAL">Individual</option>
              <option value="TEAM">Team</option>
            </select>
          </fieldset>

          <fieldset className={styles.fieldset}>
            <label htmlFor="division" className={styles.label}>Division *</label>
            <select
              id="division"
              name="division"
              value={formData.division}
              onChange={handleInputChange}
              required
              className={styles.select}
              aria-invalid={!!state.errors.division}
              aria-describedby={state.errors.division ? 'division-error' : undefined}
            >
              <option value="WOMEN_INDIVIDUAL_OPEN">Women Individual Open</option>
              <option value="MEN_INDIVIDUAL_OPEN">Men Individual Open</option>
              <option value="WOMEN_INDIVIDUAL_PRO">Women Individual Pro</option>
              <option value="MEN_INDIVIDUAL_PRO">Men Individual Pro</option>
              <option value="MIXED_TEAM">Mixed Team</option>
            </select>
            {state.errors.division && (
              <span id="division-error" className={styles.error_message}>
                {state.errors.division}
              </span>
            )}
          </fieldset>
        </div>

        <div className={styles.form_row}>
          <fieldset className={styles.fieldset}>
            <label htmlFor="weightValue" className={styles.label}>Weight *</label>
            <input
              type="number"
              id="weightValue"
              name="weightValue"
              value={formData.weightValue}
              onChange={handleInputChange}
              min="30"
              max="200"
              step="0.5"
              required
              className={styles.input}
              aria-invalid={!!state.errors.weightValue}
              aria-describedby={state.errors.weightValue ? 'weight-error' : undefined}
            />
            {state.errors.weightValue && (
              <span id="weight-error" className={styles.error_message}>
                {state.errors.weightValue}
              </span>
            )}
          </fieldset>

          <fieldset className={styles.fieldset}>
            <label htmlFor="weightUnit" className={styles.label}>Unit *</label>
            <select
              id="weightUnit"
              name="weightUnit"
              value={formData.weightUnit}
              onChange={handleInputChange}
              required
              className={styles.select}
            >
              <option value="kg">kg</option>
              <option value="lb">lb</option>
            </select>
          </fieldset>
        </div>

        <fieldset className={styles.fieldset}>
          <label className={styles.label}>Recent 5K Time *</label>
          <div className={styles.time_input}>
            <input
              type="number"
              name="fiveKmTimeMinutes"
              value={formData.fiveKmTimeMinutes}
              onChange={handleInputChange}
              min="15"
              max="60"
              placeholder="Minutes"
              aria-label="5K minutes"
              required
              className={styles.input}
            />
            <span>:</span>
            <input
              type="number"
              name="fiveKmTimeSeconds"
              value={String(formData.fiveKmTimeSeconds).padStart(2, '0')}
              onChange={handleInputChange}
              min="0"
              max="59"
              placeholder="00"
              aria-label="5K seconds"
              className={styles.input}
            />
          </div>
          {state.errors.fiveKmTimeSeconds && (
            <span className={styles.error_message}>{state.errors.fiveKmTimeSeconds}</span>
          )}
        </fieldset>

        <fieldset className={styles.fieldset}>
          <label htmlFor="fiveKmRecency" className={styles.label}>When did you take this 5K test? *</label>
          <select
            id="fiveKmRecency"
            name="fiveKmRecency"
            value={formData.fiveKmRecency}
            onChange={handleInputChange}
            required
            className={styles.select}
          >
            <option value="RECENT">Within 30 days</option>
            <option value="3_MONTHS">30–90 days ago</option>
            <option value="6_MONTHS">90–180 days ago</option>
            <option value="STALE">Over 6 months ago</option>
            <option value="NO_DATA">I haven't taken a recent 5K test</option>
          </select>
        </fieldset>

        <fieldset className={styles.fieldset}>
          <label htmlFor="competitionDateDays" className={styles.label}>HYROX Competition Date *</label>
          <div className={styles.help_text}>How many days away?</div>
          <input
            type="number"
            id="competitionDateDays"
            name="competitionDateDays"
            value={formData.competitionDateDays}
            onChange={handleInputChange}
            min="1"
            max="365"
            required
            className={styles.input}
            aria-invalid={!!state.errors.competitionDate}
            aria-describedby={state.errors.competitionDate ? 'date-error' : undefined}
          />
          {state.errors.competitionDate && (
            <span id="date-error" className={styles.error_message}>
              {state.errors.competitionDate}
            </span>
          )}
        </fieldset>

        <fieldset className={styles.fieldset}>
          <label className={styles.label}>Target Finish Time (optional)</label>
          <div className={styles.time_input}>
            <input
              type="number"
              name="targetTimeMinutes"
              value={formData.targetTimeMinutes}
              onChange={handleInputChange}
              min="15"
              max="240"
              placeholder="Minutes"
              aria-label="Target minutes"
              className={styles.input}
            />
            <span>:</span>
            <input
              type="number"
              name="targetTimeSeconds"
              value={String(formData.targetTimeSeconds).padStart(2, '0')}
              onChange={handleInputChange}
              min="0"
              max="59"
              placeholder="00"
              aria-label="Target seconds"
              className={styles.input}
            />
          </div>
          {state.errors.targetFinishTimeSeconds && (
            <span className={styles.error_message}>{state.errors.targetFinishTimeSeconds}</span>
          )}
        </fieldset>

        <fieldset className={styles.fieldset}>
          <label htmlFor="priorHyroxResult" className={styles.label}>Have you done HYROX before?</label>
          <select
            id="priorHyroxResult"
            name="priorHyroxResult"
            value={formData.priorHyroxResult}
            onChange={handleInputChange}
            className={styles.select}
          >
            <option value="NO_PRIOR_RESULT">No, first time</option>
            <option value="COMPLETED">Yes, I completed it</option>
            <option value="DNF">Yes, but I didn't finish</option>
          </select>
        </fieldset>

        <button type="submit" disabled={state.loading} className={styles.button}>
          {state.loading ? 'Estimating...' : 'Get My Finish Time Estimate'}
        </button>
      </form>

      {/* Live estimation preview [T-10] */}
      {state.liveEstimate && !state.result && (
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          backgroundColor: '#f0f4ff',
          borderRadius: '8px',
          borderLeft: '4px solid #667eea',
        }}>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#666' }}>
            📊 Live estimate as you type:
          </p>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea', marginBottom: '0.5rem' }}>
            {Math.floor(state.liveEstimate.lowSeconds / 60)}:{String(state.liveEstimate.lowSeconds % 60).padStart(2, '0')} – {Math.floor(state.liveEstimate.highSeconds / 60)}:{String(state.liveEstimate.highSeconds % 60).padStart(2, '0')}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#666' }}>
            Confidence: {Math.round(state.liveEstimate.confidence * 100)}%
          </div>
        </div>
      )}
    </div>
  );
}

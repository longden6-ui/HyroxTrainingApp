'use client';

import { useState } from 'react';
import { RecencyBandSchema, DivisionSchema, CategorySchema } from '@/src/lib/predictor/schema';
import { createPrediction } from '@/src/lib/actions/predict';
import { formatDuration, formatWeight } from '@/src/lib/units';
import { PredictorResult } from './PredictorResult';

interface FormState {
  loading: boolean;
  errors: Record<string, string>;
  result?: any;
}

export function PredictorForm() {
  const [state, setState] = useState<FormState>({
    loading: false,
    errors: {},
  });

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

    // Clear error for this field
    setState((prev) => ({
      ...prev,
      errors: {
        ...prev.errors,
        [name]: '',
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState({ loading: true, errors: {} });

    try {
      // Build competition date
      const competitionDate = new Date();
      competitionDate.setDate(competitionDate.getDate() + formData.competitionDateDays);

      // Build target time
      const targetFinishTimeSeconds =
        formData.targetTimeMinutes || formData.targetTimeSeconds
          ? parseInt(formData.targetTimeMinutes || '0', 10) * 60 +
            parseInt(formData.targetTimeSeconds || '0', 10)
          : undefined;

      // Build 5K time
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
    <div className="predictor-form">
      <h1>HYROX Time Predictor</h1>
      <p className="subtitle">
        Get an estimated finish-time range based on your running fitness and event details.
      </p>

      <form onSubmit={handleSubmit}>
        {state.errors._form && (
          <div className="error-banner" role="alert">
            {state.errors._form}
          </div>
        )}

        {/* Age */}
        <fieldset>
          <label htmlFor="age">Age *</label>
          <input
            type="number"
            id="age"
            name="age"
            value={formData.age}
            onChange={handleInputChange}
            min="16"
            max="120"
            required
            aria-invalid={!!state.errors.age}
            aria-describedby={state.errors.age ? 'age-error' : undefined}
          />
          {state.errors.age && (
            <span id="age-error" className="error-message">
              {state.errors.age}
            </span>
          )}
        </fieldset>

        {/* Category & Division */}
        <div className="form-row">
          <fieldset>
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
            >
              <option value="INDIVIDUAL">Individual</option>
              <option value="TEAM">Team</option>
            </select>
          </fieldset>

          <fieldset>
            <label htmlFor="division">Division *</label>
            <select
              id="division"
              name="division"
              value={formData.division}
              onChange={handleInputChange}
              required
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
              <span id="division-error" className="error-message">
                {state.errors.division}
              </span>
            )}
          </fieldset>
        </div>

        {/* Weight */}
        <div className="form-row">
          <fieldset>
            <label htmlFor="weightValue">Weight *</label>
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
              aria-invalid={!!state.errors.weightValue}
              aria-describedby={state.errors.weightValue ? 'weight-error' : undefined}
            />
            {state.errors.weightValue && (
              <span id="weight-error" className="error-message">
                {state.errors.weightValue}
              </span>
            )}
          </fieldset>

          <fieldset>
            <label htmlFor="weightUnit">Unit *</label>
            <select
              id="weightUnit"
              name="weightUnit"
              value={formData.weightUnit}
              onChange={handleInputChange}
              required
            >
              <option value="kg">kg</option>
              <option value="lb">lb</option>
            </select>
          </fieldset>
        </div>

        {/* 5K Time */}
        <fieldset>
          <label>Recent 5K Time *</label>
          <div className="time-input">
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
            />
          </div>
          {state.errors.fiveKmTimeSeconds && (
            <span className="error-message">{state.errors.fiveKmTimeSeconds}</span>
          )}
        </fieldset>

        {/* 5K Recency */}
        <fieldset>
          <label htmlFor="fiveKmRecency">When did you take this 5K test? *</label>
          <select
            id="fiveKmRecency"
            name="fiveKmRecency"
            value={formData.fiveKmRecency}
            onChange={handleInputChange}
            required
          >
            <option value="RECENT">Within 30 days</option>
            <option value="3_MONTHS">30–90 days ago</option>
            <option value="6_MONTHS">90–180 days ago</option>
            <option value="STALE">Over 6 months ago</option>
            <option value="NO_DATA">I haven't taken a recent 5K test</option>
          </select>
        </fieldset>

        {/* Competition Date */}
        <fieldset>
          <label htmlFor="competitionDateDays">HYROX Competition Date *</label>
          <div className="help-text">How many days away?</div>
          <input
            type="number"
            id="competitionDateDays"
            name="competitionDateDays"
            value={formData.competitionDateDays}
            onChange={handleInputChange}
            min="1"
            max="365"
            required
            aria-invalid={!!state.errors.competitionDate}
            aria-describedby={state.errors.competitionDate ? 'date-error' : undefined}
          />
          {state.errors.competitionDate && (
            <span id="date-error" className="error-message">
              {state.errors.competitionDate}
            </span>
          )}
        </fieldset>

        {/* Target Time (Optional) */}
        <fieldset>
          <label>Target Finish Time (optional)</label>
          <div className="time-input">
            <input
              type="number"
              name="targetTimeMinutes"
              value={formData.targetTimeMinutes}
              onChange={handleInputChange}
              min="15"
              max="240"
              placeholder="Minutes"
              aria-label="Target minutes"
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
            />
          </div>
          {state.errors.targetFinishTimeSeconds && (
            <span className="error-message">{state.errors.targetFinishTimeSeconds}</span>
          )}
        </fieldset>

        {/* Prior Result (Optional) */}
        <fieldset>
          <label htmlFor="priorHyroxResult">Have you done HYROX before?</label>
          <select
            id="priorHyroxResult"
            name="priorHyroxResult"
            value={formData.priorHyroxResult}
            onChange={handleInputChange}
          >
            <option value="NO_PRIOR_RESULT">No, first time</option>
            <option value="COMPLETED">Yes, I completed it</option>
            <option value="DNF">Yes, but I didn't finish</option>
          </select>
        </fieldset>

        <button type="submit" disabled={state.loading}>
          {state.loading ? 'Estimating...' : 'Get My Finish Time Estimate'}
        </button>
      </form>

      <style jsx>{`
        .predictor-form {
          max-width: 600px;
          margin: 0 auto;
          padding: 2rem;
        }

        h1 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        .subtitle {
          color: #666;
          margin-bottom: 2rem;
        }

        form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        fieldset {
          border: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        label {
          font-weight: 500;
          font-size: 0.95rem;
        }

        input,
        select {
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }

        input:focus,
        select:focus {
          outline: none;
          border-color: #0066cc;
          box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
        }

        input[aria-invalid='true'],
        select[aria-invalid='true'] {
          border-color: #d32f2f;
        }

        .time-input {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .time-input input {
          flex: 1;
          text-align: center;
        }

        .time-input span {
          font-weight: 600;
        }

        .error-message {
          color: #d32f2f;
          font-size: 0.875rem;
        }

        .error-banner {
          background-color: #ffebee;
          border: 1px solid #d32f2f;
          border-radius: 4px;
          padding: 1rem;
          color: #d32f2f;
        }

        .help-text {
          font-size: 0.875rem;
          color: #666;
        }

        button {
          padding: 0.875rem;
          background-color: #0066cc;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        button:hover:not(:disabled) {
          background-color: #0052a3;
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 600px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

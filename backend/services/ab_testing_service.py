# backend/services/ab_testing_service.py
import random
import hashlib
import json
from datetime import datetime
from models import db, User, ABTestEvent  # مدل از models.py می‌آید


class ABTestingService:
    def __init__(self):
        self.experiments = {}
        self.load_experiments()

    def load_experiments(self):
        self.experiments = {
            'homepage_hero': {
                'name': 'تست صفحه اصلی',
                'variants': ['cyber', 'minimal', 'corporate'],
                'weights': [0.33, 0.33, 0.34],
                'metrics': ['ctr', 'bounce_rate', 'time_on_page'],
                'is_active': True
            },
            'pricing_layout': {
                'name': 'چیدمان صفحه قیمت‌گذاری',
                'variants': ['horizontal', 'vertical'],
                'weights': [0.5, 0.5],
                'metrics': ['conversion_rate', 'avg_order_value'],
                'is_active': True
            },
            'cta_color': {
                'name': 'رنگ دکمه CTA',
                'variants': ['blue', 'green', 'orange'],
                'weights': [0.33, 0.33, 0.34],
                'metrics': ['click_rate'],
                'is_active': True
            },
            'course_card_style': {
                'name': 'استایل کارت دوره‌ها',
                'variants': ['default', 'compact', 'expanded'],
                'weights': [0.4, 0.3, 0.3],
                'metrics': ['enrollment_rate', 'time_to_click'],
                'is_active': True
            },
            'signup_flow': {
                'name': 'فرآیند ثبت‌نام',
                'variants': ['single_page', 'multi_step', 'social_first'],
                'weights': [0.33, 0.33, 0.34],
                'metrics': ['completion_rate', 'drop_off_step'],
                'is_active': True
            }
        }

    def assign_variant(self, user_id, experiment_key):
        if experiment_key not in self.experiments:
            return None
        experiment = self.experiments[experiment_key]
        if not experiment['is_active']:
            return experiment['variants'][0]
        hash_input = f"{user_id}_{experiment_key}"
        hash_value = int(hashlib.md5(hash_input.encode()).hexdigest(), 16)
        total_weight = sum(experiment['weights'])
        normalized = hash_value % total_weight
        cumulative = 0
        for i, weight in enumerate(experiment['weights']):
            cumulative += weight * (total_weight / sum(experiment['weights']))
            if normalized < cumulative:
                return experiment['variants'][i]
        return experiment['variants'][-1]

    def track_event(self, user_id, experiment_key, variant, event_type, data=None):
        event = ABTestEvent(
            user_id=user_id,
            experiment_key=experiment_key,
            variant=variant,
            event_type=event_type,
            data=json.dumps(data) if data else None
        )
        db.session.add(event)
        db.session.commit()

    def get_experiment_results(self, experiment_key):
        if experiment_key not in self.experiments:
            return None
        experiment = self.experiments[experiment_key]
        results = {}
        for variant in experiment['variants']:
            events = ABTestEvent.query.filter_by(
                experiment_key=experiment_key,
                variant=variant
            ).all()
            total = len(events)
            conversions = sum(1 for e in events if e.event_type == 'conversion')
            results[variant] = {
                'total_users': total,
                'conversions': conversions,
                'conversion_rate': round(conversions / total * 100, 2) if total > 0 else 0,
                'events': self._count_events(events)
            }
        winner = self._determine_winner(results)
        return {
            'experiment': experiment,
            'results': results,
            'winner': winner,
            'confidence': self._calculate_confidence(results)
        }

    def _count_events(self, events):
        counts = {}
        for e in events:
            counts[e.event_type] = counts.get(e.event_type, 0) + 1
        return counts

    def _determine_winner(self, results):
        best_variant = None
        best_rate = -1
        for variant, data in results.items():
            if data['conversion_rate'] > best_rate:
                best_rate = data['conversion_rate']
                best_variant = variant
        return {'variant': best_variant, 'conversion_rate': best_rate}

    def _calculate_confidence(self, results):
        variants = list(results.keys())
        if len(variants) < 2:
            return 50
        rates = [results[v]['conversion_rate'] for v in variants]
        max_rate = max(rates)
        avg_rate = sum(rates) / len(rates)
        if avg_rate == 0:
            return 50
        improvement = (max_rate - avg_rate) / avg_rate * 100
        confidence = min(95, 50 + improvement * 2)
        return round(confidence, 1)

    def get_all_experiments(self):
        return {key: {
            'name': exp['name'],
            'variants': exp['variants'],
            'is_active': exp['is_active'],
            'metrics': exp['metrics']
        } for key, exp in self.experiments.items()}
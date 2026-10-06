import json
from models import Course, Member, Mission, DataAccess


class ChatService:
    def __init__(self):
        self.greetings = [
            'سلام! من دستیار هوشمند ماه‌افزار هستم. چطور می‌تونم کمکتون کنم؟',
            'درود بر شما! هر سوالی در مورد خدمات، آموزش‌ها یا اعضای تیم دارید، بپرسید.'
        ]

    def get_response(self, message):
        message_lower = message.lower().strip()

        # Greetings
        if any(word in message_lower for word in ['سلام', 'خوبی', 'چطوری']):
            return self.greetings[0], []

        # Search in courses
        if any(word in message_lower for word in ['آموزش', 'دوره', 'یادگیری', 'کلاس']):
            courses = Course.query.filter(Course.title.ilike(f'%{message}%')).limit(3).all()
            if courses:
                response = '🎓 آموزش‌های مرتبط:\n\n'
                for course in courses:
                    response += f"• {course.title} - {course.level}\n"
                return response, [c.title for c in courses]

        # Search in members
        if any(word in message_lower for word in ['اعضا', 'تیم', 'مدیر', 'برنامه‌نویس', 'متخصص']):
            members = Member.query.filter(Member.name.ilike(f'%{message}%')).limit(3).all()
            if members:
                response = '👥 اعضای مرتبط:\n\n'
                for member in members:
                    response += f"• {member.name} - {member.position}\n"
                return response, [m.name for m in members]

        # Search in missions
        if any(word in message_lower for word in ['ماموریت', 'رسالت', 'هدف', 'چشم‌انداز']):
            missions = Mission.query.all()
            if missions:
                response = '🎯 ماموریت‌های ما:\n\n'
                for mission in missions:
                    response += f"• {mission.title}: {mission.content[:100]}...\n"
                return response, [m.title for m in missions]

        # Search in data access
        if any(word in message_lower for word in ['داده', 'دسترسی', 'api', 'دانلود']):
            accesses = DataAccess.query.all()
            if accesses:
                response = '📊 روش‌های دسترسی به داده:\n\n'
                for access in accesses:
                    response += f"• {access.title} ({access.access_type})\n"
                return response, [a.title for a in accesses]

        # Default response
        return (
            'متوجه نشدم! می‌تونید در مورد آموزش‌ها، اعضای تیم، ماموریت‌ها یا نحوه دسترسی به داده‌ها سوال کنید. 😊',
            []
        )
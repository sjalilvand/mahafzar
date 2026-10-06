import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  Brain, Cpu, Layers, Monitor, BarChart3, Globe,
  Award, GraduationCap, BookOpen, Building2, Heart,
  TrendingUp, Shield, Database, Server, Cloud,
  Code2, LineChart, PieChart, Users, Target, Zap,Search
} from 'lucide-react';
import './About.css';

// ============= ANIMATION VARIANTS =============
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const scaleIn = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
};

const AnimatedSection = ({ children, className }) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
  return (
    <motion.section
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={staggerContainer}
    >
      {children}
    </motion.section>
  );
};

const About = () => {
  return (
    <div className="about-page-new">
      <div className="bg-animation" />

      <div className="container">
        {/* ============= HERO SECTION ============= */}
        <AnimatedSection className="glass-panel hero-panel">
          <div className="icon-box">
            <Brain size={40} className="icon-neon-cyan" />
          </div>
          <h1 className="hero-title gradient-text">
            معرفی شرکت ماه افزار هوشمند رسا
          </h1>
          <p className="hero-subtitle">
            پیشرو در تحول دیجیتال، هوشمندسازی و بهره‌گیری از قابلیت‌های هوش مصنوعی
          </p>

          <p className="body-text">
            <strong>شرکت ماه افزار هوشمند رسا</strong> با بهره‌گیری از تیمی متشکل از مدیران ارشد، اساتید دانشگاه،
            نخبگان فناوری اطلاعات و متخصصین حوزه رفاه اجتماعی، مجموعه‌ای پیشرو در ارائه راهکارهای نوین تحول دیجیتال،
            هوشمندسازی سازمانی و توسعه سامانه‌ها و محصولات مبتنی بر هوش مصنوعی است.
          </p>
          <p className="body-text">
            این شرکت با تکیه بر تجربه اجرایی، دانش دانشگاهی و توانمندی فناورانه، تمرکز ویژه‌ای بر طراحی، تولید و
            پیاده‌سازی راهکارهایی دارد که بتوانند سازمان‌ها را از وضعیت{' '}
            <span className="highlight-text">سنتی، جزیره‌ای و فرآیندمحور</span>، به سمت{' '}
            <span className="highlight-text">سازمان‌های هوشمند، داده‌محور، پیش‌بین، یادگیرنده و پلتفرم‌محور</span>{' '}
            هدایت کنند.
          </p>
          <p className="body-text">
            هسته مرکزی این شرکت با تلفیق سه بازوی قدرتمند زیر، توانایی منحصر به فردی در تبدیل سازمان‌های سنتی
            فرآیند‌محور به پلتفرم‌های هوشمند داده‌محور دارد:
          </p>

          <div className="cards-grid">
            <motion.div className="feature-card" variants={scaleIn}>
              <Cpu size={40} className="feature-icon" />
              <h4 className="mini-title">تکنولوژی</h4>
              <p className="timeline-desc">شامل هوش مصنوعی، داده‌کاوی، یادگیری ماشین، کلان‌داده و رایانش ابری</p>
            </motion.div>
            <motion.div className="feature-card" variants={scaleIn}>
              <Layers size={40} className="feature-icon-yellow" />
              <h4 className="mini-title">مدیریت</h4>
              <p className="timeline-desc">شامل مدیریت پروژه، مدیریت استراتژیک و معماری سازمانی</p>
            </motion.div>
            <motion.div className="feature-card" variants={scaleIn}>
              <Users size={40} className="feature-icon-cyan" />
              <h4 className="mini-title">دانش محتوایی</h4>
              <p className="timeline-desc">شامل رفتارشناسی داده بر اساس تحلیل جامعه هدف</p>
            </motion.div>
          </div>

          <p className="body-text">
            تمرکز ما بر طراحی اکوسیستم‌هایی است که با کمترین هزینه اجرایی، بیشترین بهره‌وری، شفافیت، چابکی، دقت
            تصمیم‌گیری و قابلیت پیش‌بینی را برای سازمان‌ها به ارمغان می‌آورد. در این مسیر،{' '}
            <strong>هوش مصنوعی</strong> به‌عنوان موتور محرک محصولات، نقش محوری در تحلیل داده‌ها، شناسایی الگوها،
            پیش‌بینی نیازها، بهینه‌سازی منابع، خودکارسازی فرآیندها و ارتقای تجربه ذی‌نفعان ایفا می‌کند.
          </p>
        </AnimatedSection>

        {/* ============= PRODUCTS SECTION ============= */}
        <AnimatedSection className="glass-panel">
          <h2 className="section-header">
            <Zap size={28} className="icon-neon-green" /> محصولات و راهکارهای هوشمند
          </h2>
          <p className="body-text">
            شرکت ماه افزار هوشمند رسا علاوه بر ارائه خدمات مشاوره، طراحی و پیاده‌سازی سامانه‌های سازمانی، دارای{' '}
            <strong>رویکرد محصول‌محور</strong> در حوزه هوش مصنوعی است و راهکارهای خود را در سه قالب اصلی توسعه می‌دهد:
          </p>

          <div className="cards-grid">
            <motion.div className="feature-card" variants={scaleIn}>
              <Monitor size={40} className="feature-icon" />
              <h4 className="mini-title">خط تولید هوشمند سامانه‌های اطلاعاتی</h4>
              <p className="body-text-small">
                با هدف تسریع، استانداردسازی و هوشمندسازی فرآیند تولید سامانه‌ها. این سامانه‌ها از ابتدا بر پایه داده،
                الگوریتم‌های هوشمند و قابلیت یادگیری بنا شده‌اند و صرفاً ابزار ثبت داده نیستند، بلکه{' '}
                <strong>تحلیل‌گر، پیشنهاددهنده، هشداردهنده و تصمیم‌یار</strong> هستند.
              </p>
            </motion.div>

            <motion.div className="feature-card" variants={scaleIn}>
              <Server size={40} className="feature-icon-cyan" />
              <h4 className="mini-title">افزودن هوش مصنوعی به ابزارهای موجود</h4>
              <p className="body-text-small">
                بدون کنار گذاشتن سرمایه‌گذاری‌های قبلی، ابزارهای موجود هوشمندتر می‌شوند. شامل: تحلیل داده، پیش‌بینی
                رفتار، پردازش متن و تصویر، تشخیص هویت، چت‌بات، سیستم هشداردهنده و پایش عملکرد متناسب با نیاز مشتری.
              </p>
            </motion.div>

            <motion.div className="feature-card" variants={scaleIn}>
              <Search size={40} className="feature-icon-yellow" />
              <h4 className="mini-title">محصولات پایش ۳۶۰ درجه نیازهای مشتریان</h4>
              <p className="body-text-small">
                شناخت جامع، دقیق و لحظه‌ای از رفتارها، مشکلات و الگوهای مصرف با بهره‌گیری از داده‌های ساختاریافته و
                غیرساختاریافته. استفاده از <strong>پردازش زبان طبیعی، تحلیل احساسات و خوشه‌بندی</strong> برای تصمیم‌گیری
                دقیق‌تر و افزایش رضایت ذی‌نفعان.
              </p>
            </motion.div>
          </div>
        </AnimatedSection>

        {/* ============= DEPARTMENTS SECTION ============= */}
        <AnimatedSection className="glass-panel">
          <h2 className="section-header">
            <Layers size={28} className="icon-neon-green" /> دسته‌بندی خدمات و قابلیت‌ها
          </h2>
          <p className="body-text">این شرکت خدمات خود را در سه دپارتمان اصلی ارائه می‌دهد:</p>

          {/* دپارتمان ۱ */}
          <div className="department-block">
            <h3 className="sub-title">
              <Monitor size={24} /> ۱. دپارتمان هوش مصنوعی، داده و فناوری اطلاعات
            </h3>
            <span className="department-tag tag-cyan">(محور تکنولوژی)</span>
            <p className="body-text">
              قلب فناورانه شرکت ماه افزار هوشمند رسا با مأموریت طراحی، تولید، پیاده‌سازی و توسعه سامانه‌ها، محصولات و
              پلتفرم‌های هوشمند مبتنی بر هوش مصنوعی.
            </p>
            <ul className="custom-list">
              <li><span className="highlight-text">طراحی و پیاده‌سازی سکوهای هوشمند (Platform Design):</span> معماری مبتنی بر پلتفرم جهت گذر به وضعیت هوشمند، معماری توزیع‌شده بر بستر Cloud و Fog Computing جهت پردازش بلادرنگ، یکپارچه‌سازی داده‌ها و یادگیری از رفتار کاربران.</li>
              <li><span className="highlight-text">هوش تجاری و تحلیل داده (BI & Analytics):</span> طراحی انباره داده (Data Warehouse)، فرآیندهای ETL، دریاچه داده (Data Lake) و داشبوردهای تصمیم‌یار، هشداردهنده و پیش‌بینی‌کننده با PowerBI و Tableau.</li>
              <li><span className="highlight-text">هوش مصنوعی و یادگیری ماشین (AI & ML):</span> متدولوژی CRISP-DM، پردازش متن NLP، بینایی ماشین، یادگیری عمیق (Deep Learning)، خوشه‌بندی و منطق فازی (Fuzzy Logic) در تخصیص منابع با Python و R.</li>
              <li><span className="highlight-text">یکپارچه‌سازی سیستم‌ها و توسعه نرم‌افزار:</span> طراحی ESB، حاکمیت داده (DMBOK)، توسعه Agile با زبان‌های C# و Python.</li>
              <li><span className="highlight-text">تولید محصولات و هوشمندسازی:</span> تولید سامانه‌های هوشمند، هوشمندسازی ابزارهای سخت‌افزاری/نرم‌افزاری و تولید محصولات پایش ۳۶۰ درجه.</li>
            </ul>
          </div>

          <hr className="divider" />

          {/* دپارتمان ۲ */}
          <div className="department-block">
            <h3 className="sub-title">
              <PieChart size={24} /> ۲. دپارتمان مدیریت استراتژیک و مدیریت پروژه
            </h3>
            <span className="department-tag tag-yellow">(محور مدیریت)</span>
            <p className="body-text">
              مسئول طراحی مسیر تحول، برنامه‌ریزی راهبردی، مدیریت تغییر، کنترل پروژه و تضمین تحقق اهداف سازمانی در
              پروژه‌های هوشمندسازی.
            </p>
            <ul className="custom-list">
              <li><span className="highlight-text">برنامه‌ریزی استراتژیک و معماری سازمانی:</span> تدوین چشم‌انداز، SWOT, BSC, KPI. پیاده‌سازی چارچوب‌های TOGAF و FEAF برای همسوسازی فناوری با کسب‌وکار.</li>
              <li><span className="highlight-text">مدیریت ریسک و پروژه:</span> مدیریت پروژه‌های کلان EPC، کنترل هزینه بر اساس PMBOK، استقرار EPM و مدیریت ریسک کیفیت داده و پذیرش سازمانی.</li>
              <li><span className="highlight-text">مهندسی مجدد فرآیندها و حاکمیت IT:</span> تحلیل و بهینه‌سازی BPM، استقرار BPMS، پیاده‌سازی COBIT و مدلسازی با BPMN 2.0. استفاده از AI برای کشف گلوگاه‌ها.</li>
            </ul>
          </div>

          <hr className="divider" />

          {/* دپارتمان ۳ */}
          <div className="department-block">
            <h3 className="sub-title">
              <Globe size={24} /> ۳. دپارتمان رفتارشناسی داده و پژوهش‌های راهبردی
            </h3>
            <span className="department-tag tag-green">(محور دانش تخصصی)</span>
            <p className="body-text">
              نقش کلیدی در تبدیل داده‌های خام به شناخت عمیق از جامعه هدف. هوش مصنوعی در اینجا ابزاری برای فهم دقیق
              رفتار انسان و سیاست‌گذاری داده‌محور است.
            </p>
            <ul className="custom-list">
              <li><span className="highlight-text">آسیب‌شناسی سازمانی:</span> بررسی اثربخشی خدمات حمایتی، اشتغال و فرهنگی کمیته امداد با داده‌کاوی برای کشف نقاط ضعف و شناسایی گروه‌های پرریسک.</li>
              <li><span className="highlight-text">سیاست‌گذاری رفاه اجتماعی:</span> تدوین مدل‌های نوین فقرزدایی، بیمه‌های اجتماعی و توانمندسازی مبتنی بر شواهد داده‌محور.</li>
              <li><span className="highlight-text">نظارت، ارزیابی و پژوهش‌های توسعه‌ای:</span> پایش طرح‌های کلان ملی در محرومیت‌زدایی، سنجش رضایت ذی‌نفعان و تألیف کتب تخصصی برای پشتیبانی علمی.</li>
            </ul>
          </div>
        </AnimatedSection>

        {/* ============= EXPERIENCE SECTION ============= */}
        <AnimatedSection className="glass-panel">
          <h2 className="section-header">
            <Award size={28} className="icon-neon-green" /> سوابق کاری و تجربیات کلیدی تیم اجرایی
          </h2>
          <p className="body-text">
            اعضای کلیدی «ماه افزار هوشمند رسا» دارای سوابق درخشان در سطوح ملی، بین‌المللی و دانشگاهی هستند که
            تضمین‌کننده موفقیت پروژه‌های آتی است.
          </p>

          <h3 className="sub-title">
            <Building2 size={22} /> الف) سوابق در حوزه هوشمندسازی و کمیته امداد
          </h3>
          <div className="timeline">
            {[
              { title: 'مدیریت پروژه «امداد هوشمند» (سها)', desc: 'طراحی و پیاده‌سازی سامانه جامع هوشمندسازی خدمات کمیته امداد و گذار از سیستم‌های جزیره‌ای به پلتفرم یکپارچه.' },
              { title: 'تولید سند «کمیته امداد سکویی مبتنی بر هوش مصنوعی»', desc: 'طراحی مدل کسب‌وکار جدید امداد در معماری ۶ لایه مبتنی بر استانداردهای پلتفرمی.' },
              { title: 'راه‌اندازی Data Lake و Data Warehouse کمیته امداد', desc: 'تجمیع، Data Cleansing و یکپارچه‌سازی کلان‌داده‌های سازمانی جهت تحلیل‌های هوشمند.' },
              { title: 'طراحی سامانه هوشمند رتبه‌بندی و خوشه‌بندی', desc: 'استفاده از الگوریتم‌های یادگیری ماشین برای طبقه‌بندی هوشمند مددجویان و خدمات.' },
              { title: 'پروژه ملی «کارسنجی مبتنی بر داده»', desc: 'طراحی پلتفرم گزارشات هوشمند کارسنجی و تحلیل بار کاری مبتنی بر Power BI و لاگ‌های سیستمی.' },
              { title: 'طراحی سامانه بیمه‌های اجتماعی و ماشین توانمندسازی', desc: 'طراحی سیستم‌های مبتنی بر داده برای پوشش صدها هزار خانوار و خروج هدفمند مددجویان از چرخه فقر.' },
              { title: 'مدیریت پروژه معماری سازمانی کمیته امداد', desc: 'راهبری فنی بازمهندسی ساختار و فرایندهای کلان امداد.' }
            ].map((item, idx) => (
              <motion.div key={idx} className="timeline-item" variants={fadeInUp}>
                <div className="timeline-title">{item.title}</div>
                <div className="timeline-desc">{item.desc}</div>
              </motion.div>
            ))}
          </div>

          <h3 className="sub-title">
            <GraduationCap size={22} /> ب) سوابق پژوهشی، آکادمیک و سیاست‌گذاری
          </h3>
          <div className="timeline">
            {[
              { title: 'عضویت هیئت علمی و تدریس', desc: 'بیش از ۱۳ سال سابقه تدریس در مقاطع دکتری و ارشد در حوزه مهندسی نرم‌افزار و سیستم‌های هوشمند.' },
              { title: 'مدیریت کل دفتر مطالعات و پژوهش کمیته امداد', desc: 'هدایت ده‌ها طرح پژوهشی در زمینه اثربخشی خدمات حمایتی.' },
              { title: 'مشارکت در تدوین برنامه ششم و هفتم توسعه', desc: 'سیاست‌گذاری کلان در حوزه رفاه و تأمین اجتماعی.' },
              { title: 'تألیف و تدوین کتب مرجع', desc: 'تألیف کتب تخصصی در حوزه‌های داده‌کاوی، آزمون نرم‌افزار، مدیریت فرآیندها و الگوریتم‌های هوشمند.' },
              { title: 'انتشار مقالات علمی-پژوهشی بین‌المللی', desc: 'در زمینه رایانش ابری، Scheduling و بازشناسی الگو (Pattern Recognition).' }
            ].map((item, idx) => (
              <motion.div key={idx} className="timeline-item" variants={fadeInUp}>
                <div className="timeline-title">{item.title}</div>
                <div className="timeline-desc">{item.desc}</div>
              </motion.div>
            ))}
          </div>

          <h3 className="sub-title">
            <Building2 size={22} /> ج) سوابق پروژه‌های صنعتی، فرهنگی و زیرساختی
          </h3>
          <div className="timeline">
            {[
              { title: 'پروژه‌های کلان وزارت فرهنگ و ارشاد اسلامی', desc: 'تولید سامانه‌های ملی نظیر "پلتزار"، شبکه فعالان فرهنگی، "صباکارپ" و سامانه جشنواره‌ها.' },
              { title: 'پروژه‌های حوزه سلامت و درمان', desc: 'مدیریت اسناد بیمارستانی در بیمارستان لبافی‌نژاد و اداره کل درمان تأمین اجتماعی.' },
              { title: 'پروژه‌های بانکی و مالی', desc: 'پیاده‌سازی CRM و BPMS در بانک سینا.' },
              { title: 'پروژه‌های نفت و گاز و صنعتی', desc: 'مدیریت پروژه‌های شرکت ساسول آفریقای جنوبی و استقرار ERP در ایران خودرو و همکاران سیستم.' }
            ].map((item, idx) => (
              <motion.div key={idx} className="timeline-item" variants={fadeInUp}>
                <div className="timeline-title">{item.title}</div>
                <div className="timeline-desc">{item.desc}</div>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
};

export default About;
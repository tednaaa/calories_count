# Changelog

## v0.7.1 (2026-10-04)

- fix(profile): keep the date of birth field inside the screen on iOS [`beed47ab`](https://github.com/tednaaa/calories_count/commit/beed47abfe246b6cbc4b9302d5bf35ba826a7984)

## v0.7.0 (2026-10-04)

- feat(a11y): announce whether calendar days and nutrients are within target [`d800d960`](https://github.com/tednaaa/calories_count/commit/d800d960f2755213e60247bae2a6fed0d1e16fe8)
- feat(profile): ask for date of birth instead of age [`61abe119`](https://github.com/tednaaa/calories_count/commit/61abe11963180add2bbfed06fa7b9bc71f6b647d)

## v0.6.0 (2026-10-03)

- feat(stats): lead the weight tab with real energy burn and hide the details [`44b0df38`](https://github.com/tednaaa/calories_count/commit/44b0df3848684d8ca5f4919579f93359757db907)
- feat(stats): split statistics into calories and weight tabs [`ceed2764`](https://github.com/tednaaa/calories_count/commit/ceed2764f70be02f6131d337c087c7b2fe61b33c)
- feat(settings): split settings into a short list of sections [`1d64c4e8`](https://github.com/tednaaa/calories_count/commit/1d64c4e8fd4e506ea48ef9395cb8ca3e3875b70d)
- feat(stats): show calories as a month calendar you can page back through [`f608ffe6`](https://github.com/tednaaa/calories_count/commit/f608ffe6300aa3e638e653098bb997ee262501e5)
- feat(today): gently remind to weigh in after two days [`8f8c8ef7`](https://github.com/tednaaa/calories_count/commit/8f8c8ef72182cad051411f143e425651b9d286fd)
- feat(profile): show BMI and healthy weight range for height [`17c7000b`](https://github.com/tednaaa/calories_count/commit/17c7000bb57dcacb71d5cee38911ddf02796d3d9)
- feat(profile): set a target weight without a deadline [`e42bb97e`](https://github.com/tednaaa/calories_count/commit/e42bb97e9b56561555aeff3c8489f05752df34db)
- feat(stats): suggest a calorie target from real energy burn [`1d550a45`](https://github.com/tednaaa/calories_count/commit/1d550a45460a9f37eba04a0189fe1a20031d2113)
- feat(stats): show how eating moved weight over four weeks [`e2202a22`](https://github.com/tednaaa/calories_count/commit/e2202a220c99bcb0cdf1d0343b0527482e78aed2)
- feat(stats): log today's weight from the week screen [`db3afcce`](https://github.com/tednaaa/calories_count/commit/db3afcce27d5e1a1c85f5705e488fca64125223a)
- feat(profile): enter weight with tenths of a kilogram [`ca4019fb`](https://github.com/tednaaa/calories_count/commit/ca4019fb61face5da2323cfad12195eeaf1b0290)
- feat: migrate calories-count to shonk-ui 0.7.0 [`efd44418`](https://github.com/tednaaa/calories_count/commit/efd44418f58532b79bfb3596cb2735a4318df6c9)

## v0.5.4 (2026-09-07)

- refactor(entry-row): swipe to delete with the shonk-ui SwipeAction [`9bcf33e2`](https://github.com/tednaaa/calories_count/commit/9bcf33e2ed810800727ebfa4b34c290ae75171ab)

## v0.5.3 (2026-09-02)

- migrate shonk-ui v0.4.0 [`ad9ce725`](https://github.com/tednaaa/calories_count/commit/ad9ce7259c8ae79d76b05b1c1298418b987d1a98)

## v0.5.2 (2026-08-30)

- fix(week-strip): lock calendar swipe to the horizontal axis [`bd8a15ba`](https://github.com/tednaaa/calories_count/commit/bd8a15bade94222a5fffa27e4b5c9668138f7638)

## v0.5.1 (2026-08-27)

- tell apart a missing product from a base that did not answer [`6840902f`](https://github.com/tednaaa/calories_count/commit/6840902fae337e0a4afe544adcb04197adbb4a3e)
- remember barcodes on your own foods [`2eb3f04b`](https://github.com/tednaaa/calories_count/commit/2eb3f04b112b2b436d0fcdfa08f0535818611c30)

## v0.5.0 (2026-08-27)

- show how the day went beyond calories [`bed7231f`](https://github.com/tednaaa/calories_count/commit/bed7231fecdb6694dd1c09b41142b14c4ed65523)
- scan barcodes with the camera and store nutrients from the label [`01d60301`](https://github.com/tednaaa/calories_count/commit/01d603018242a8b92756c474aec81b2abc7dbcc2)
- measure portions in grams or millilitres [`20c306d6`](https://github.com/tednaaa/calories_count/commit/20c306d67f9a28aa2e0153de349379313244cba3)
- enter calories per serving weight in custom food form [`c95e6a3b`](https://github.com/tednaaa/calories_count/commit/c95e6a3bc2266a0189857f3cc370b269c1f7d41a)

## v0.4.6 (2026-08-27)

- disable browser swipe navigation overlay [`9e856172`](https://github.com/tednaaa/calories_count/commit/9e85617277f7a82ecccbafd80d246d66c656c3d3)
- shift selected day by gestures over day summary [`d50c0c9a`](https://github.com/tednaaa/calories_count/commit/d50c0c9abbe0d9dfb1c5e577d9485608632c8063)

## v0.4.5 (2026-08-24)

- use suffixed lucide icon names in code [`edb91b98`](https://github.com/tednaaa/calories_count/commit/edb91b984c8b9e82ed2491449497a043a3709aa0)
- zoom food photo on tap in day list and entry form [`2504eb4e`](https://github.com/tednaaa/calories_count/commit/2504eb4ef534a043ea5f112e7c0aac6520fc991e)

## v0.4.4 (2026-08-23)

- replace day header with a swipeable week strip calendar [`edb131a5`](https://github.com/tednaaa/calories_count/commit/edb131a5c9bd4f0bc93f5de45223c0784a1d767b)

## v0.4.3 (2026-08-22)

- use the large viewport height for the app shell in standalone mode [`fc7066aa`](https://github.com/tednaaa/calories_count/commit/fc7066aae3a6902c8c49df3cafe9db2fae9ce804)

## v0.4.2 (2026-08-22)

- require scroll room before collapsing the day header [`0b588912`](https://github.com/tednaaa/calories_count/commit/0b58891215806173d5e0c34c52b91832a7d38ee2)
- fix bottom gap on cold start by sizing the shell with percentage height [`ebe4fc05`](https://github.com/tednaaa/calories_count/commit/ebe4fc05e2a60b2801513ee56cf68780aa678871)
- toggle food in cart on tap instead of stacking quantity [`aac4b3fb`](https://github.com/tednaaa/calories_count/commit/aac4b3fb9d7b5e393568ce9482752ac99d0f777e)

## v0.4.1 (2026-08-21)

- upgrade shonk-ui to 0.3.0 and set the Russian locale [`14265a3a`](https://github.com/tednaaa/calories_count/commit/14265a3acb740c342096ddddbcb502a5ebfa7257)

## v0.4.0 (2026-08-21)

- refactor: say «избранное» in labels and drop the duplicate delete button [`d1eabe6d`](https://github.com/tednaaa/calories_count/commit/d1eabe6d90f51a47fed60d33ecd1704cd7f02b23)
- fix: offer keeping a catalog entry as a custom food [`87094511`](https://github.com/tednaaa/calories_count/commit/870945114d55fdd23b2059ec886f33b32dfac6cf)
- feat: keep an edited entry as a custom food [`7ebbf42b`](https://github.com/tednaaa/calories_count/commit/7ebbf42baae501bdd818754551f1243e686566da)
- feat: edit a diary entry on its own screen [`49adc842`](https://github.com/tednaaa/calories_count/commit/49adc842544324c16f239dc77540764a9ab4782c)
- fix: ask before removing an entry and lock the swipe axis [`7a99145a`](https://github.com/tednaaa/calories_count/commit/7a99145ad02b2eac87e2c5d1a1711119f46687a6)
- feat: collapse the day header on any scroll [`e6a1a42f`](https://github.com/tednaaa/calories_count/commit/e6a1a42f73923c0ad40f128fa3fef077d00aead4)
- fix: scope touch-action to controls so iOS keeps input focus [`e3005a2d`](https://github.com/tednaaa/calories_count/commit/e3005a2de98cdd8291e5387de520ec8d443ea37e)

## v0.3.2 (2026-08-20)

- fix: label entry calories with the unit [`270efc2d`](https://github.com/tednaaa/calories_count/commit/270efc2d192010de5d00c1bf751b7acaf8d00824)
- feat: collapse day header ring on scroll [`322ab597`](https://github.com/tednaaa/calories_count/commit/322ab597b7c5221060329e5248c95c2ef469e7f7)

## v0.3.1 (2026-08-20)

- fix: pin screen headers by bounding the app shell height [`abaac6d0`](https://github.com/tednaaa/calories_count/commit/abaac6d04657e007a140648260a7fbadc287785e)
- feat: disable pinch and double tap zoom on mobile [`feda88b9`](https://github.com/tednaaa/calories_count/commit/feda88b92741ef72eb1ca0b23e882dc4c2ad851f)

## v0.3.0 (2026-08-20)

- feat: add sugar spoon photo and drop coffee with sugar [`8900de48`](https://github.com/tednaaa/calories_count/commit/8900de48d48fdeb550d8e86d61fd4089bb5844d8)
- feat: switch the add grid between cards, large cards and a list [`79122f38`](https://github.com/tednaaa/calories_count/commit/79122f38d8025943a01edb7ce52758da25a02cc1)
- feat: keep custom foods in the grid and manage them in settings [`76f04e37`](https://github.com/tednaaa/calories_count/commit/76f04e378f7034e8d0707e35628f4192fcee7f8b)

## v0.2.0 (2026-08-20)

- feat: add coffee with sugar and a photoless candy [`dcfa6976`](https://github.com/tednaaa/calories_count/commit/dcfa6976d9293f57e4e35ae14523387bf3a6f336)
- feat: allow half portions and add gorilla energy drink [`d24d981e`](https://github.com/tednaaa/calories_count/commit/d24d981e1d24f612f6a0ff36a37feb0a791708f6)
- add pepsi zero [`1047c4d6`](https://github.com/tednaaa/calories_count/commit/1047c4d63b3dcf9d9f916b5803125777f00a56aa)
- docs: describe calibrating the target against real weight change [`fda4a981`](https://github.com/tednaaa/calories_count/commit/fda4a981caa466e0d5f04ee066fc0e1db26424b6)
- feat: add a form for one-off dishes with an optional photo [`648dcd67`](https://github.com/tednaaa/calories_count/commit/648dcd67f5118c2493bd292f432a93df24c4c71f)
- fix: pin the cart above the bottom nav via a shared sticky dock [`03fc1aab`](https://github.com/tednaaa/calories_count/commit/03fc1aab1f49cdb63bc46dcedfb7179ea3846faf)
- fix: respect the top safe area and hide the category scrollbar [`d7380572`](https://github.com/tednaaa/calories_count/commit/d7380572bdd722c8d53a6708aab478ab58c4ecfa)

## v0.1.1 (2026-08-20)

- foods [`91f97126`](https://github.com/tednaaa/calories_count/commit/91f97126ae0d752d85661a614aa7ac9aa03e0b0b)

## v0.1.0 (2026-08-20)

- gitlab => github [`1387206d`](https://github.com/tednaaa/calories_count/commit/1387206d2899b02690602bcad604472c93f12f44)
- chore: add scripted releases and move build scripts to typescript [`e817dc0b`](https://github.com/tednaaa/calories_count/commit/e817dc0bdbc6af1c23488f38a5ad5088d4529885)
- ci: restructure gitlab pipeline into lint, test and pages stages [`ee12b295`](https://github.com/tednaaa/calories_count/commit/ee12b295cc59187a294eff3e455660ac38b3cf31)
- feat: add pwa manifest, icons, storage persistence and gitlab pages ci [`7c5fd98c`](https://github.com/tednaaa/calories_count/commit/7c5fd98c2af7ae222db6eb4e52e8771c835bdc8b)
- feat: add settings screen with profile editing, backup and data reset [`8f738e5e`](https://github.com/tednaaa/calories_count/commit/8f738e5e6cb59e7b9951d0cff017631e244e94c6)
- feat: add weekly stats screen and put viewed day in the url [`1a26016c`](https://github.com/tednaaa/calories_count/commit/1a26016c196ba90f4a36fd512a87aca455ffd2d7)
- feat: add food picker screen with cart and backdated entries [`ad8ca6b8`](https://github.com/tednaaa/calories_count/commit/ad8ca6b859d535e0481bc8acc693e5ab3b3cb7d3)
- docs: record data reset decision and roadmap progress [`3cdaec4d`](https://github.com/tednaaa/calories_count/commit/3cdaec4d154278bd3be3d7cb74fc5e7599037408)
- feat: add today screen with progress ring and diary feed [`7f5a69cc`](https://github.com/tednaaa/calories_count/commit/7f5a69ccbf32b8a63de884bfcb544ce8d8d6e9ce)
- feat: add calorie target onboarding and profile route guard [`f93b348a`](https://github.com/tednaaa/calories_count/commit/f93b348a7ba558a253b2756c5e610dfc8b22cc43)
- feat: add app shell with bottom navigation and page stubs [`f1a2ce94`](https://github.com/tednaaa/calories_count/commit/f1a2ce94681f8685623c732fe6e9ad27ede3e0ce)
- feat: add calorie targets and diary entry logic [`6cedd2ef`](https://github.com/tednaaa/calories_count/commit/6cedd2ef36a065bb93250c497f32514eb45d9aa6)
- docs: align spec paths with feature-sliced layout [`5d646dd8`](https://github.com/tednaaa/calories_count/commit/5d646dd80f944596409271489b2fa082a3a4e543)
- feat: add date utilities, IndexedDB schema and food catalog [`3154d485`](https://github.com/tednaaa/calories_count/commit/3154d485abc095cd471b528e4320d96b280967df)
- init vite [`b8bb6197`](https://github.com/tednaaa/calories_count/commit/b8bb619735ba4db086880cdb2352ce4a64a4dd98)
- init devenv [`2a7c6a69`](https://github.com/tednaaa/calories_count/commit/2a7c6a69f64c5b73d40d51c367e1879a10470d9d)
- add license [`f34e5616`](https://github.com/tednaaa/calories_count/commit/f34e56167336312ab22de85ecffb3255783cf6c9)

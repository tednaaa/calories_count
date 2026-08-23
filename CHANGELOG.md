# Changelog

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

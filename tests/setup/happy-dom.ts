import { GlobalRegistrator } from '@happy-dom/global-registrator'

// next/image and next/link resolve URLs against location, so it can't be about:blank.
GlobalRegistrator.register({ url: 'http://localhost:3000' })

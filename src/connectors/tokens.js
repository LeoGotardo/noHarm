const ACCESS_KEY  = 'nh_access'
const REFRESH_KEY = 'nh_refresh'

export const tokens = {
  getAccess:  ()      => localStorage.getItem(ACCESS_KEY),
  getRefresh: ()      => localStorage.getItem(REFRESH_KEY),
  set: ({ accessToken, refreshToken }) => {
    localStorage.setItem(ACCESS_KEY,  accessToken)
    localStorage.setItem(REFRESH_KEY, refreshToken)
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}

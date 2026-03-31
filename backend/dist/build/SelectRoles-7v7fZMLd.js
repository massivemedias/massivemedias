import{q as p,a as d,cD as g,j as e,cE as u,o as m,ca as f,b$ as h,B as x,H as i,bi as j,bj as b,cF as C,h as M,cG as y}from"./strapi-ChTDxfn5.js";import{u as k}from"./useAdminRoles-Cyx2SBwS.js";const v=({children:a,target:t})=>{const{toggleNotification:n}=p(),{formatMessage:o}=d(),{copy:r}=g(),c=o({id:"app.component.CopyToClipboard.label",defaultMessage:"Copy to clipboard"}),l=async s=>{s.preventDefault(),await r(t)&&n({type:"info",message:o({id:"notification.link-copied"})})};return e.jsx(u,{endAction:e.jsx(m,{label:c,variant:"ghost",onClick:l,children:e.jsx(f,{})}),title:t,titleEllipsis:!0,subtitle:a,icon:e.jsx("span",{style:{fontSize:32},children:"✉️"}),iconBackground:"neutral100"})},w=({registrationToken:a})=>{const{formatMessage:t}=d(),n=`${window.location.origin}${h()}/auth/register?registrationToken=${a}`;return e.jsx(v,{target:n,children:t({id:"app.components.Users.MagicLink.connect",defaultMessage:"Copy and share this link to give access to this user"})})},U=({disabled:a})=>{const{isLoading:t,roles:n}=k(),{formatMessage:o}=d(),{value:r=[],onChange:c,error:l}=x("roles");return e.jsxs(i.Root,{error:l,hint:o({id:"app.components.Users.ModalCreateBody.block-title.roles.description",defaultMessage:"A user can have one or several roles"}),name:"roles",required:!0,children:[e.jsx(i.Label,{children:o({id:"app.components.Users.ModalCreateBody.block-title.roles",defaultMessage:"User's roles"})}),e.jsx(j,{disabled:a,onChange:s=>{c("roles",s)},placeholder:o({id:"app.components.Select.placeholder",defaultMessage:"Select"}),startIcon:t?e.jsx($,{}):void 0,value:r.map(s=>s.toString()),withTags:!0,children:n.map(s=>e.jsx(b,{value:s.id.toString(),children:o({id:`global.${s.code}`,defaultMessage:s.name})},s.id))}),e.jsx(i.Error,{}),e.jsx(i.Hint,{})]})},L=y`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(359deg);
  }
`,S=M.div`
  animation: ${L} 2s infinite linear;
`,$=()=>e.jsx(S,{children:e.jsx(C,{})});export{w as M,U as S,v as a};

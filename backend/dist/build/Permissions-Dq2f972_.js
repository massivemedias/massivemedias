import{d6 as Ve,aP as Oe,gR as Ge,gS as We,fj as $e,gT as Ke,gU as Xe,gV as Ye,gW as ze,gX as qe,c7 as Ze,fg as ve,cS as Je,gY as he,gZ as I,f2 as Z,g_ as Qe,g$ as Ue,h0 as U,h1 as Te,h as v,T as y,j as n,Z as O,a as _,bG as L,I as E,r as A,eL as k,gM as es,dk as ss,z as oe,cs as ts,co as N,cx as ns,cy as is,b8 as os,h2 as rs,cb as Me,h3 as ce,h4 as as,fA as ls,eQ as z,U as ge,c$ as H,cN as R}from"./strapi-ChTDxfn5.js";import{c as ie}from"./cloneDeep-B0wwf7El.js";import{_ as cs}from"./_baseEach-TvKcZZLY.js";const[ds,ps]=Ve("PermissionsDataManager"),Y=()=>ps("usePermissionsDataManager");var us=qe,hs=Ye,gs=Ze,ms=$e,fs=ze,xs=ve,Cs=Ge,bs=Xe,js=Ke,ys=We;function As(e,s,i){var t=xs(e),o=t||Cs(e)||ys(e);if(s=ms(s),i==null){var a=e&&e.constructor;o?i=t?new a:[]:js(e)?i=bs(a)?hs(fs(e)):{}:i={}}return(o?us:gs)(e,function(l,r,c){return s(i,l,r,c)}),i}var ks=As;const Ss=Oe(ks);function me(e,s){function i(t,o){return Ss(t,(a,l,r)=>(Je(l,o[r])||(a[r]=he(l)&&he(o[r])?i(l,o[r]):l),a))}return i(e,s)}const we=e=>Array.isArray(e)?e.reduce((s,i)=>(Array.isArray(i)?s.push(...we(i)):s.push(i),s),[]):[],V=e=>I(e)?we(Object.values(e).map(s=>I(s)?V(s):s)):[],_e=(e,s,i)=>e.find(t=>t.action===s&&t.subject===i),Os=e=>{const s=fe(e.plugins),i=fe(e.settings),t=xe(e.collectionTypes),o=xe(e.singleTypes);return[...s,...i,...t,...o]},fe=e=>Object.values(e).reduce((s,i)=>{const t=Object.values(i).reduce((o,a)=>{const l=Object.entries(a).reduce((r,[c,{conditions:d,properties:{enabled:p}}])=>(p&&r.push({action:c,subject:null,conditions:re(d),properties:{}}),r),[]);return[...o,...l]},[]);return[...s,...t]},[]),xe=e=>Object.entries(e).reduce((i,t)=>{const[o,a]=t,l=Object.entries(a).reduce((r,c)=>{const[d,p]=c;if(!V(p).some(h=>h))return r;if(!p?.properties?.enabled){const h=Object.entries(p.properties).reduce((C,f)=>{const[u,m]=f;return C.properties[u]=Pe(m),C},{action:d,subject:o,conditions:re(p.conditions),properties:{}});return[...r,h]}return p.properties.enabled&&r.push({action:d,subject:o,properties:{},conditions:re(p.conditions)}),r},[]);return[...i,...l]},[]),Pe=(e,s="")=>Object.entries(e).reduce((i,t)=>{const[o,a]=t;return I(a)?[...i,...Pe(a,`${s}${o}.`)]:(a&&!I(a)&&i.push(`${s}${o}`),i)},[]),re=e=>Object.entries(e).filter(([,s])=>s).map(([s])=>s),Ee=(e,s=[])=>e.reduce((i,t)=>(i[t.id]=s.indexOf(t.id)!==-1,i),{}),Ce=(e,s,i=[])=>e.reduce((t,{categoryId:o,childrenForm:a})=>{const l=a.reduce((r,c)=>(r[c.subCategoryId]=c.actions.reduce((d,p)=>{const g=_e(i,p.action,null);return d[p.action]={properties:{enabled:g!==void 0},conditions:Ee(s,g?.conditions??[])},d},{}),r),{});return t[o]=l,t},{}),$s=(e,s,i)=>{const t=({children:o=[]},a,l="")=>o.reduce((r,c)=>{if(c.children)return{...r,[c.value]:t(c,a,`${l}${c.value}.`)};const d=a.indexOf(`${l}${c.value}`)!==-1;return r[c.value]=d,r},{});return e.reduce((o,a)=>{const l=s.properties.find(({value:r})=>r===a);if(l){const r=i?.properties[l.value]??[],c=t(l,r);o.properties[a]=c}return o},{properties:{}})},be=({subjects:e,actions:s=[]},i,t=[])=>s.reduce((o,a)=>{const l=a.subjects.reduce((c,d)=>{const p=e.find(({uid:g})=>g===d)||null;return p&&(c[d]=p),c},{});if(Z(l))return o;const r=Object.keys(l).reduce((c,d)=>{const{actionId:p,applyToProperties:g}=a,f=l[d].properties.map(({value:x})=>x).every(x=>(g||[]).indexOf(x)===-1),u=_e(t,p,d),m=Ee(i,u?.conditions??[]);if(c[d]||(c[d]={}),Z(g)||f)return c[d][p]={properties:{enabled:u!==void 0},conditions:m},c;const b=$s(g,l[d],u);return c[d][p]={...b,conditions:m},c},{});return Qe(o,r)},{});function vs(e,s,i,t){for(var o=-1,a=e==null?0:e.length;++o<a;){var l=e[o];s(t,l,i(l),e)}return t}var Ts=vs,Ms=cs;function ws(e,s,i,t){return Ms(e,function(o,a,l){s(t,o,i(o),l)}),t}var _s=ws,Ps=Ts,Es=_s,Ls=$e,Rs=ve;function Ds(e,s){return function(i,t){var o=Rs(i)?Ps:Es,a=s?s():{};return o(i,e,Ls(t),a)}}var Ns=Ds,Is=Ue,Fs=Ns,Bs=Object.prototype,Hs=Bs.hasOwnProperty,Vs=Fs(function(e,s,i){Hs.call(e,i)?e[i].push(s):Is(e,i,[s])}),Gs=Vs;const ae=Oe(Gs),je=(e,s)=>Object.entries(ae(e,s)).map(([i,t])=>({category:i,categoryId:i.split(" ").join("-"),childrenForm:Object.entries(ae(t,"subCategory")).map(([o,a])=>({subCategoryName:o,subCategoryId:o.split(" ").join("-"),actions:a}))})),Q=e=>Object.keys(e).reduce((s,i)=>{const t=e[i];if(I(t)&&!U(t,"conditions"))return{...s,[i]:Q(t)};if(I(t)&&U(t,"conditions")&&!V(Te(t,"conditions")).some(a=>a)){const a=Object.keys(t.conditions).reduce((l,r)=>(l[r]=!1,l),{});return{...s,[i]:{...t,conditions:a}}}return s[i]=t,s},{}),q=(e,s,i=!1)=>Object.keys(e).reduce((t,o)=>{const a=e[o];return o==="conditions"&&!i?(t[o]=a,t):I(a)?{...t,[o]:q(a,s,o==="fields")}:(t[o]=s,t)},{}),D="12rem",de="20rem",se="5.3rem",pe=e=>e?Object.entries(e).reduce((s,[i,t])=>(i!=="conditions"&&(s[i]=t),s),{}):null,G=e=>{const s=pe(e),i=V(s);if(!i.length)return{hasAllActionsSelected:!1,hasSomeActionsSelected:!1};const t=i.every(a=>a),o=i.some(a=>a)&&!t;return{hasAllActionsSelected:t,hasSomeActionsSelected:o}},Le=v(y)`
  padding-right: ${({theme:e})=>e.spaces[2]};
  overflow: hidden;
  flex: 1;
  ${({$isCollapsable:e})=>e&&"cursor: pointer;"}
`,ue=v.div`
  width: ${D};
`,Re=()=>n.jsx(O,{color:"danger700",paddingLeft:1,children:"*"}),De=({checkboxName:e="",children:s,isActive:i=!1,isCollapsable:t=!1,isFormDisabled:o=!1,label:a,onChange:l,onClick:r,someChecked:c=!1,value:d})=>{const{formatMessage:p}=_(),g={title:a,alignItems:"center",$isCollapsable:t};return t&&Object.assign(g,{onClick:r,"aria-expanded":i,onKeyDown({key:h}){(h==="Enter"||h===" ")&&r()},tabIndex:0,role:"button"}),n.jsxs(y,{alignItems:"center",paddingLeft:6,width:de,shrink:0,children:[n.jsx(O,{paddingRight:2,children:n.jsx(L,{name:e,"aria-label":p({id:"Settings.permissions.select-all-by-permission",defaultMessage:"Select all {label} permissions"},{label:a}),disabled:o,onCheckedChange:h=>l({target:{name:e,value:!!h}}),checked:c?"indeterminate":d})}),n.jsxs(Le,{...g,children:[n.jsx(E,{ellipsis:!0,children:a}),s]})]})},Ws=({availableActions:e=[],childrenForm:s=[],isFormDisabled:i,label:t,pathToData:o,propertyName:a})=>{const l=A.useMemo(()=>e.map(r=>{const c=Array.isArray(r.applyToProperties)&&r.applyToProperties.indexOf(a)!==-1&&r.isDisplayed;return{label:r.label,actionId:r.actionId,isActionRelatedToCurrentProperty:c}}),[e,a]);return n.jsxs(y,{display:"inline-flex",direction:"column",alignItems:"stretch",minWidth:0,children:[n.jsx(et,{label:t,headers:l}),n.jsx(O,{children:s.map(({children:r,label:c,value:d,required:p},g)=>n.jsx(Ks,{childrenForm:r,label:c,isFormDisabled:i,name:d,required:p,propertyActions:l,pathToData:o,propertyName:a,isOdd:g%2===0},d))})]})},Ks=({childrenForm:e=[],label:s,isFormDisabled:i=!1,name:t,required:o=!1,pathToData:a,propertyActions:l,propertyName:r,isOdd:c=!1})=>{const{formatMessage:d}=_(),[p,g]=A.useState(null),{modifiedData:h,onChangeCollectionTypeLeftActionRowCheckbox:C,onChangeParentCheckbox:f,onChangeSimpleCheckbox:u}=Y(),m=p===t,b=A.useMemo(()=>Array.isArray(e)?e:[],[e]),x=b.length>0,j=A.useCallback(()=>{x&&g(S=>S===t?null:t)},[x,t]),$=({target:{value:S}})=>{C(a,r,t,S)},{hasAllActionsSelected:M,hasSomeActionsSelected:w}=A.useMemo(()=>Xs(l,h,a,r,t),[l,h,a,r,t]);return n.jsxs(n.Fragment,{children:[n.jsx(Ys,{alignItems:"center",$isCollapsable:x,$isActive:m,background:c?"neutral100":"neutral0",children:n.jsxs(y,{children:[n.jsxs(De,{onChange:$,onClick:j,isCollapsable:x,isFormDisabled:i,label:s,someChecked:w,value:M,isActive:m,children:[o&&n.jsx(Re,{}),n.jsx(J,{$isActive:m})]}),n.jsx(y,{children:l.map(({label:S,isActionRelatedToCurrentProperty:P,actionId:W})=>{if(!P)return n.jsx(ue,{},S);const T=[...a.split(".."),W,"properties",r,t];if(!x){const B=k(h,T,!1);return n.jsx(y,{width:D,position:"relative",justifyContent:"center",alignItems:"center",children:n.jsx(L,{disabled:i,name:T.join(".."),"aria-label":d({id:"Settings.permissions.select-by-permission",defaultMessage:"Select {label} permission"},{label:`${t} ${S}`}),onCheckedChange:He=>{u({target:{name:T.join(".."),value:!!He}})},checked:B})},W)}const K=k(h,T,{}),{hasAllActionsSelected:F,hasSomeActionsSelected:ne}=G(K);return n.jsx(y,{width:D,position:"relative",justifyContent:"center",alignItems:"center",children:n.jsx(L,{disabled:i,name:T.join(".."),onCheckedChange:B=>{f({target:{name:T.join(".."),value:!!B}})},"aria-label":d({id:"Settings.permissions.select-by-permission",defaultMessage:"Select {label} permission"},{label:`${t} ${S}`}),checked:ne?"indeterminate":F})},S)})})]})}),m&&n.jsx(Ne,{childrenForm:b,isFormDisabled:i,parentName:t,pathToDataFromActionRow:a,propertyName:r,propertyActions:l,recursiveLevel:0})]})},Xs=(e,s,i,t,o)=>{const l=e.reduce((r,c)=>(c.isActionRelatedToCurrentProperty&&r.push(c.actionId),r),[]).reduce((r,c)=>{const d=k(s,[...i.split(".."),c,"properties",t,o],!1);return r[c]=d,r},{});return G(l)},Ys=v(y)`
  height: ${se};
  flex: 1;

  &:hover {
    ${({$isCollapsable:e,theme:s})=>e&&ee(s)}
  }

  ${({$isCollapsable:e})=>e&&`
      ${J} {
        display: flex;
      }
  `}
  ${({$isActive:e,theme:s})=>e&&ee(s)};
`,J=v(ss)`
  display: none;

  svg {
    width: 1.4rem;
  }

  path {
    fill: ${({theme:e})=>e.colors.neutral200};
  }

  transform: rotate(${({$isActive:e})=>e?"180":"0"}deg);
  margin-left: ${({theme:e})=>e.spaces[2]};
`,Ne=({childrenForm:e=[],isFormDisabled:s,recursiveLevel:i,pathToDataFromActionRow:t,propertyActions:o,parentName:a,propertyName:l})=>{const{formatMessage:r}=_(),{modifiedData:c,onChangeParentCheckbox:d,onChangeSimpleCheckbox:p}=Y(),[g,h]=A.useState(null),C=u=>{h(m=>m===u?null:u)},f=A.useMemo(()=>g?e.find(({value:u})=>u===g):null,[g,e]);return n.jsxs(O,{paddingLeft:"3.2rem",children:[n.jsx(Js,{}),e.map(({label:u,value:m,required:b,children:x},j)=>{const $=j+1<e.length,M=Array.isArray(x),w=g===m;return n.jsxs(zs,{$isVisible:$,children:[n.jsxs(y,{height:se,children:[n.jsx(Qs,{children:n.jsx(Us,{width:"20",height:"23",viewBox:"0 0 20 23",fill:"none",xmlns:"http://www.w3.org/2000/svg",$color:"primary200",children:n.jsx("path",{fillRule:"evenodd",clipRule:"evenodd",d:"M7.02477 14.7513C8.65865 17.0594 11.6046 18.6059 17.5596 18.8856C18.6836 18.9384 19.5976 19.8435 19.5976 20.9688V20.9688C19.5976 22.0941 18.6841 23.0125 17.5599 22.9643C10.9409 22.6805 6.454 20.9387 3.75496 17.1258C0.937988 13.1464 0.486328 7.39309 0.486328 0.593262H4.50974C4.50974 7.54693 5.06394 11.9813 7.02477 14.7513Z",fill:"#D9D8FF"})})}),n.jsxs(y,{style:{flex:1},children:[n.jsx(qs,{$level:i,$isActive:w,$isCollapsable:M,children:n.jsxs(Le,{alignItems:"center",$isCollapsable:M,...M&&{onClick:()=>C(m),"aria-expanded":w,onKeyDown:({key:S})=>(S==="Enter"||S===" ")&&C(m),tabIndex:0,role:"button"},title:u,children:[n.jsx(Zs,{ellipsis:!0,children:u}),b&&n.jsx(Re,{}),n.jsx(J,{$isActive:w})]})}),n.jsx(y,{style:{flex:1},children:o.map(({actionId:S,label:P,isActionRelatedToCurrentProperty:W})=>{if(!W)return n.jsx(ue,{},S);const T=[...t.split(".."),S,"properties",l,...a.split(".."),m],K=k(c,T,!1);if(!x)return n.jsx(y,{position:"relative",width:D,justifyContent:"center",alignItems:"center",children:n.jsx(L,{disabled:s,name:T.join(".."),"aria-label":r({id:"Settings.permissions.select-by-permission",defaultMessage:"Select {label} permission"},{label:`${a} ${u} ${P}`}),onCheckedChange:B=>{p({target:{name:T.join(".."),value:!!B}})},checked:K})},P);const{hasAllActionsSelected:F,hasSomeActionsSelected:ne}=G(K);return n.jsx(y,{position:"relative",width:D,justifyContent:"center",alignItems:"center",children:n.jsx(L,{disabled:s,name:T.join(".."),"aria-label":r({id:"Settings.permissions.select-by-permission",defaultMessage:"Select {label} permission"},{label:`${a} ${u} ${P}`}),onCheckedChange:B=>{d({target:{name:T.join(".."),value:!!B}})},checked:ne?"indeterminate":F},P)},P)})})]})]}),f&&w&&n.jsx(O,{paddingBottom:2,children:n.jsx(Ne,{isFormDisabled:s,parentName:`${a}..${m}`,pathToDataFromActionRow:t,propertyActions:o,propertyName:l,recursiveLevel:i+1,childrenForm:f.children})})]},m)})]})},zs=v(O)`
  border-left: ${({$isVisible:e,theme:s})=>e?`4px solid ${s.colors.primary200}`:"4px solid transparent"};
`,qs=v(y)`
  padding-left: ${({theme:e})=>e.spaces[4]};
  width: ${({$level:e})=>145-e*36}px;

  &:hover {
    ${({$isCollapsable:e,theme:s})=>e&&ee(s)}
  }

  ${({$isCollapsable:e})=>e&&`
      ${J} {
        display: flex;
      }
  `}
  ${({$isActive:e,theme:s})=>e&&ee(s)};
`,Zs=v(E)``,Js=v.div`
  padding-top: ${({theme:e})=>e.spaces[2]};
  margin-top: ${({theme:e})=>e.spaces[2]};
  width: 0.4rem;
  background-color: ${({theme:e})=>e.colors.primary200};
  border-top-left-radius: 2px;
  border-top-right-radius: 2px;
`,Qs=v(O)`
  transform: translate(-4px, -12px);

  &:before {
    content: '';
    width: 0.4rem;
    height: 1.2rem;
    background: ${({theme:e})=>e.colors.primary200};
    display: block;
  }
`,Us=v.svg`
  position: relative;
  flex-shrink: 0;
  transform: translate(-0.5px, -1px);

  * {
    fill: ${({theme:e,$color:s})=>e.colors[s]};
  }
`,et=({headers:e=[],label:s})=>{const{formatMessage:i}=_();return n.jsxs(y,{children:[n.jsx(y,{width:de,height:se,shrink:0,alignItems:"center",paddingLeft:6,children:n.jsx(E,{variant:"sigma",textColor:"neutral500",children:i({id:"Settings.roles.form.permission.property-label",defaultMessage:"{label} permissions"},{label:s})})}),e.map(t=>t.isActionRelatedToCurrentProperty?n.jsx(y,{width:D,shrink:0,justifyContent:"center",children:n.jsx(E,{variant:"sigma",textColor:"neutral500",children:i({id:`Settings.roles.form.permissions.${t.label.toLowerCase()}`,defaultMessage:t.label})})},t.label):n.jsx(y,{width:D,shrink:0},t.label))]})},ee=e=>es`
  color: ${e.colors.primary600};
  font-weight: ${e.fontWeights.bold};

  ${J} {
    path {
      fill: ${e.colors.primary600};
    }
  }
`,st=A.forwardRef(({onClick:e,className:s,hasConditions:i=!1,variant:t="tertiary"},o)=>{const{formatMessage:a}=_();return n.jsx(tt,{$hasConditions:i,className:s,children:n.jsx(oe,{variant:t,startIcon:n.jsx(ts,{}),onClick:e,ref:o,type:"button",children:a({id:"global.settings",defaultMessage:"Settings"})})})}),tt=v(O)`
  ${({$hasConditions:e,theme:s})=>e&&`
    &:before {
      content: '';
      position: absolute;
      top: -3px;
      left: -10px;
      width: 6px;
      height: 6px;
      border-radius: 2rem;
      background: ${s.colors.primary600};
    }
  `}
`,te=v(st)``,Ie=({actions:e=[],headerBreadCrumbs:s=[],isFormDisabled:i,onClose:t})=>{const{formatMessage:o}=_(),{availableConditions:a,modifiedData:l,onChangeConditions:r}=Y(),c=A.useMemo(()=>Object.entries(ae(a,"category")),[a]),d=e.filter(({isDisplayed:u,hasSomeActionsSelected:m,hasAllActionsSelected:b})=>u&&!!(m||b)),[p,g]=A.useState(ye(d,l,c)),h=(u,m)=>{g(Me(b=>{b[u]||(b[u]={}),b[u].default||(b[u].default={}),b[u].default=m}))},C=()=>{const u=Object.entries(p).reduce((m,b)=>{const[x,j]=b,$=Object.values(j).reduce((M,w)=>({...M,...w}),{});return m[x]=$,m},{});r(u),t&&t()},f=()=>{g(ye(d,l,c)),t&&t()};return n.jsxs(N.Content,{children:[n.jsx(N.Header,{children:n.jsx(ns,{id:"condition-modal-breadcrumbs",label:s.join(", "),children:s.map((u,m,b)=>n.jsx(is,{isCurrent:m===b.length-1,children:os(o({id:u,defaultMessage:u}))},u))})}),n.jsxs(N.Body,{children:[d.length===0&&n.jsx(E,{children:o({id:"Settings.permissions.conditions.no-actions",defaultMessage:"You first need to select actions (create, read, update, ...) before defining conditions on them."})}),n.jsx("ul",{children:d.map(({actionId:u,label:m,pathToConditionsObject:b},x)=>{const j=b.join("..");return n.jsx(nt,{arrayOfOptionsGroupedByCategory:c,label:m,isFormDisabled:i,isGrey:x%2===0,name:j,onChange:h,value:k(p,j,{})},u)})})]}),n.jsxs(N.Footer,{children:[n.jsx(oe,{variant:"tertiary",onClick:()=>f(),children:o({id:"app.components.Button.cancel",defaultMessage:"Cancel"})}),n.jsx(oe,{onClick:C,children:o({id:"Settings.permissions.conditions.apply",defaultMessage:"Apply"})})]})]})},ye=(e,s,i)=>e.reduce((t,o)=>{const a=k(s,[...o.pathToConditionsObject,"conditions"],{}),l=i.reduce((r,c)=>{const[d,p]=c,g=p.reduce((h,C)=>(h[C.id]=k(a,C.id,!1),h),{});return r[d]=g,r},{});return t[o.pathToConditionsObject.join("..")]=l,t},{}),nt=({arrayOfOptionsGroupedByCategory:e,isFormDisabled:s=!1,isGrey:i=!1,label:t,name:o,onChange:a,value:l})=>{const{formatMessage:r}=_(),c=d=>{a&&a(o,rt(e,d))};return n.jsxs(y,{tag:"li",background:i?"neutral100":"neutral0",paddingBottom:3,paddingTop:3,justifyContent:"space-evenly",children:[n.jsxs(y,{style:{width:180},children:[n.jsxs(E,{variant:"sigma",textColor:"neutral600",children:[r({id:"Settings.permissions.conditions.can",defaultMessage:"Can"})," "]}),n.jsx(E,{variant:"sigma",title:t,textColor:"primary600",ellipsis:!0,children:r({id:`Settings.roles.form.permissions.${t.toLowerCase()}`,defaultMessage:t})}),n.jsxs(E,{variant:"sigma",textColor:"neutral600",children:[" ",r({id:"Settings.permissions.conditions.when",defaultMessage:"When"})]})]}),n.jsx(O,{style:{maxWidth:430,width:"100%"},children:n.jsx(rs,{id:o,customizeContent:(d=[])=>`${d.length} currently selected`,onChange:c,value:it(l),options:ot(e),disabled:s})})]})},it=e=>Object.values(e).map(s=>Object.entries(s).filter(([,i])=>i).map(([i])=>i)).flat(),ot=e=>e.reduce((s,[i,t])=>(s.push({label:ce(i),children:t.map(o=>({label:o.displayName,value:o.id}))}),s),[]),rt=(e,s)=>e.map(([,i])=>i).flat().reduce((i,t)=>({[t.id]:s.includes(t.id),...i}),{}),at=({actions:e=[],isFormDisabled:s,pathToData:i,subjects:t=[]})=>{const[o,a]=A.useState(null),l=r=>()=>{a(o===r?null:r)};return n.jsx(n.Fragment,{children:t.map(({uid:r,label:c,properties:d},p)=>{const g=o===r,h=e.map(C=>({...C,isDisplayed:Array.isArray(C.subjects)&&C.subjects.indexOf(r)!==-1}));return n.jsxs(y,{direction:"column",display:"inline-flex",alignItems:"stretch",minWidth:"100%",borderColor:g?"primary600":void 0,children:[n.jsx(lt,{availableActions:h,isActive:g,isGrey:p%2===0,isFormDisabled:s,label:c,onClickToggle:l(r),pathToData:[i,r].join("..")}),g&&d.map(({label:C,value:f,children:u})=>n.jsx(Ws,{availableActions:h,childrenForm:u,isFormDisabled:s,label:C,pathToData:[i,r].join(".."),propertyName:f},f))]},r)})})},lt=({availableActions:e=[],isActive:s=!1,isGrey:i=!1,isFormDisabled:t=!1,label:o,onClickToggle:a,pathToData:l})=>{const{formatMessage:r}=_(),{modifiedData:c,onChangeParentCheckbox:d,onChangeSimpleCheckbox:p}=Y(),[g,h]=A.useState(!1),C=k(c,l.split(".."),{}),f=A.useMemo(()=>Object.keys(C).reduce((j,$)=>(j[$]=Te(C[$],"conditions"),j),{}),[C]),{hasAllActionsSelected:u,hasSomeActionsSelected:m}=G(f),b=A.useMemo(()=>ct(e,c,l),[e,c,l]),x=b.some(j=>j.hasConditions);return n.jsxs(dt,{$isActive:s,children:[n.jsxs(Fe,{height:se,flex:1,alignItems:"center",background:i?"neutral100":"neutral0",children:[n.jsx(De,{isCollapsable:!0,isFormDisabled:t,label:ce(o),checkboxName:l,onChange:d,onClick:a,someChecked:m,value:u,isActive:s,children:n.jsx(Be,{paddingLeft:2,children:s?n.jsx(as,{}):n.jsx(ls,{})})}),n.jsx(y,{style:{flex:1},children:b.map(({actionId:j,hasSomeActionsSelected:$,isDisplayed:M,...w})=>{if(!M)return n.jsx(ue,{},j);const{hasConditions:S,hasAllActionsSelected:P,isParentCheckbox:W,checkboxName:T,label:K}=w;return W?n.jsx(Ae,{justifyContent:"center",alignItems:"center",children:n.jsxs(O,{position:"relative",zIndex:1,children:[S&&n.jsx(O,{tag:"span",position:"absolute",top:"-6px",left:"37px",width:"6px",height:"6px",borderRadius:"20px",background:"primary600"}),n.jsx(L,{disabled:t,name:T,"aria-label":r({id:"Settings.permissions.select-by-permission",defaultMessage:"Select {label} permission"},{label:`${K} ${o}`}),onCheckedChange:F=>{d({target:{name:T,value:!!F}})},checked:$?"indeterminate":P})]})},j):n.jsxs(Ae,{justifyContent:"center",alignItems:"center",children:[S&&n.jsx(O,{tag:"span",position:"absolute",top:"-6px",left:"37px",width:"6px",height:"6px",borderRadius:"20px",background:"primary600"}),n.jsx(L,{disabled:t,name:T,onCheckedChange:F=>{p({target:{name:T,value:!!F}})},checked:S?"indeterminate":P})]},j)})})]}),n.jsx(O,{bottom:"10px",right:"9px",position:"absolute",children:n.jsxs(N.Root,{open:g,onOpenChange:()=>{h(j=>!j)},children:[n.jsx(N.Trigger,{children:n.jsx(te,{hasConditions:x})}),n.jsx(Ie,{headerBreadCrumbs:[o,"Settings.permissions.conditions.conditions"],actions:b,isFormDisabled:t,onClose:()=>{h(!1)}})]})})]})},ct=(e,s,i)=>e.map(({actionId:t,isDisplayed:o,applyToProperties:a,label:l})=>{if(!o)return{actionId:t,hasSomeActionsSelected:!1,isDisplayed:o};const r=[...i.split(".."),t],c=Z(a)?[...r,"properties","enabled"]:r,d=k(s,[...r,"conditions"],null),p={actionId:t,checkboxName:c.join(".."),hasConditions:V(d).some(f=>f),isDisplayed:o,label:l,pathToConditionsObject:r};if(Z(a)){const f=k(s,c,!1);return{...p,hasAllActionsSelected:f,hasSomeActionsSelected:f,isParentCheckbox:!1}}const g=k(s,c,null),{hasAllActionsSelected:h,hasSomeActionsSelected:C}=G(g);return{...p,hasAllActionsSelected:h,hasSomeActionsSelected:C,isParentCheckbox:!0}}),le=(e,s)=>`
  ${Fe} {
    background-color: ${e.colors.primary100};
    color: ${e.colors.primary600};
    border-radius: ${s?"2px 2px 0 0":"2px"};
    font-weight: ${e.fontWeights.bold};
  }

  ${Be} {
    display: flex;
  }
  ${te} {
    display: block;
  }

  &:focus-within {
    ${()=>le(e,s)}
  }
`,Fe=v(y)`
  border: 1px solid transparent;
`,dt=v.div`
  display: inline-flex;
  min-width: 100%;
  position: relative;

  ${te} {
    display: none;
  }

  ${({$isActive:e,theme:s})=>e&&le(s,e)}

  &:hover {
    ${({theme:e,$isActive:s})=>le(e,s)}
  }
`,Ae=v(y)`
  width: ${D};
  position: relative;
`,Be=v(O)`
  display: none;

  svg {
    width: 1.4rem;
  }

  path {
    fill: ${({theme:e})=>e.colors.primary600};
  }
`,pt=({actions:e=[],isFormDisabled:s,kind:i})=>{const{formatMessage:t}=_(),{modifiedData:o,onChangeCollectionTypeGlobalActionCheckbox:a}=Y(),l=e.filter(({subjects:c})=>c&&c.length),r=A.useMemo(()=>{const c=l.map(({actionId:h})=>h),d=o[i],p=c.reduce((h,C)=>(Object.keys(d).forEach(f=>{const u=k(d,[f,C]),m={[f]:pe(u)};h[C]?h[C]={...h[C],...m}:h[C]=m}),h),{});return Object.keys(p).reduce((h,C)=>(h[C]=G(p[C]),h),{})},[o,l,i]);return n.jsx(O,{paddingBottom:4,paddingTop:6,style:{paddingLeft:de},children:n.jsx(y,{gap:0,children:l.map(({label:c,actionId:d})=>n.jsxs(y,{shrink:0,width:D,direction:"column",alignItems:"center",justifyContent:"center",gap:3,children:[n.jsx(E,{variant:"sigma",textColor:"neutral500",children:t({id:`Settings.roles.form.permissions.${c.toLowerCase()}`,defaultMessage:c})}),n.jsx(L,{disabled:s,onCheckedChange:p=>{a(i,d,!!p)},name:d,"aria-label":t({id:"Settings.permissions.select-all-by-permission",defaultMessage:"Select all {label} permissions"},{label:t({id:`Settings.roles.form.permissions.${c.toLowerCase()}`,defaultMessage:c})}),checked:k(r,[d,"hasSomeActionsSelected"],!1)?"indeterminate":k(r,[d,"hasAllActionsSelected"],!1)})]},d))})})},ke=({isFormDisabled:e,kind:s,layout:{actions:i,subjects:t}})=>{const o=[...t].sort((a,l)=>a.label.localeCompare(l.label));return n.jsxs(O,{background:"neutral0",children:[n.jsx(pt,{actions:i,kind:s,isFormDisabled:e}),n.jsx(at,{actions:i,isFormDisabled:e,pathToData:s,subjects:o})]})},Se=({layout:e,...s})=>n.jsx(O,{padding:6,background:"neutral0",children:n.jsx(z.Root,{size:"M",children:e.map(({category:i,categoryId:t,childrenForm:o},a)=>n.jsx(ut,{childrenForm:o,variant:a%2===1?"primary":"secondary",name:i,pathToData:[s.kind,t],...s},i))})}),ut=({childrenForm:e,kind:s,name:i,isFormDisabled:t=!1,variant:o,pathToData:a})=>{const{formatMessage:l}=_(),r=i.split("::").pop()??"",c=r==="upload"?"Media Library":ce(r.replace(/-/g," "));return n.jsxs(z.Item,{value:i,children:[n.jsx(z.Header,{variant:o,children:n.jsx(z.Trigger,{caretPosition:"right",description:`${l({id:"Settings.permissions.category",defaultMessage:r},{category:r})} ${s==="plugins"?"plugin":s}`,children:c})}),n.jsx(z.Content,{children:n.jsx(O,{padding:6,children:e.map(({actions:d,subCategoryName:p,subCategoryId:g})=>n.jsx(ht,{actions:d,categoryName:r,isFormDisabled:t,subCategoryName:p,pathToData:[...a,g]},p))})})]})},ht=({actions:e=[],categoryName:s,isFormDisabled:i,subCategoryName:t,pathToData:o})=>{const{modifiedData:a,onChangeParentCheckbox:l,onChangeSimpleCheckbox:r}=Y(),[c,d]=A.useState(!1),{formatMessage:p}=_(),g=k(a,o,{}),h=A.useMemo(()=>Object.keys(g).reduce((x,j)=>(x[j]=pe(g[j]),x),{}),[g]),{hasAllActionsSelected:C,hasSomeActionsSelected:f}=G(h),u=A.useMemo(()=>e.map(x=>{const j=[...o,x.action,"properties","enabled"],$=k(a,j,!1),M=k(a,[...o,x.action,"conditions"],{}),w=V(M).some(S=>S);return{...x,isDisplayed:$,checkboxName:j.join(".."),hasSomeActionsSelected:$,value:$,hasConditions:w,label:x.displayName,actionId:x.action,pathToConditionsObject:[...o,x.action]}}),[e,a,o]),m=k(a,[...o],{}),b=V(Object.entries(m).reduce((x,j)=>{const[$,{conditions:M}]=j;return x[$]=M,x},{})).some(x=>x);return n.jsx(n.Fragment,{children:n.jsxs(O,{children:[n.jsxs(y,{justifyContent:"space-between",alignItems:"center",children:[n.jsx(O,{paddingRight:4,children:n.jsx(E,{variant:"sigma",textColor:"neutral600",children:t})}),n.jsx(gt,{flex:1}),n.jsx(O,{paddingLeft:4,children:n.jsx(L,{name:o.join(".."),disabled:i,onCheckedChange:x=>{l({target:{name:o.join(".."),value:!!x}})},checked:f?"indeterminate":C,children:p({id:"app.utils.select-all",defaultMessage:"Select all"})})})]}),n.jsxs(y,{paddingTop:6,paddingBottom:6,children:[n.jsx(ge.Root,{gap:2,style:{flex:1},children:u.map(({checkboxName:x,value:j,action:$,displayName:M,hasConditions:w})=>n.jsx(ge.Item,{col:4,m:6,xs:12,direction:"column",alignItems:"start",children:n.jsx(mt,{$disabled:i,$hasConditions:w,children:n.jsx(L,{name:x,disabled:i,onCheckedChange:S=>{r({target:{name:x,value:!!S}})},checked:j,children:M})})},$))}),n.jsxs(N.Root,{open:c,onOpenChange:()=>{d(x=>!x)},children:[n.jsx(N.Trigger,{children:n.jsx(te,{hasConditions:b})}),n.jsx(Ie,{headerBreadCrumbs:[s,t],actions:u,isFormDisabled:i,onClose:()=>{d(!1)}})]})]})]})})},gt=v(O)`
  align-self: center;
  border-top: 1px solid ${({theme:e})=>e.colors.neutral150};
`,mt=v.div`
  position: relative;
  word-break: keep-all;
  ${({$hasConditions:e,$disabled:s,theme:i})=>e&&`
    &:before {
      content: '';
      position: absolute;
      top: -0.4rem;
      left: -0.8rem;
      width: 0.6rem;
      height: 0.6rem;
      border-radius: 2rem;
      background: ${s?i.colors.neutral100:i.colors.primary600};
    }
  `}
`,X=[{labelId:"app.components.LeftMenuLinkContainer.collectionTypes",defaultMessage:"Collection Types",id:"collectionTypes"},{labelId:"app.components.LeftMenuLinkContainer.singleTypes",id:"singleTypes",defaultMessage:"Single Types"},{labelId:"app.components.LeftMenuLinkContainer.plugins",defaultMessage:"Plugins",id:"plugins"},{labelId:"app.components.LeftMenuLinkContainer.settings",defaultMessage:"Settings",id:"settings"}],At=A.forwardRef(({layout:e,isFormDisabled:s,permissions:i=[]},t)=>{const[{initialData:o,layouts:a,modifiedData:l},r]=A.useReducer(xt,ft,()=>Ct(e,i)),{formatMessage:c}=_();A.useImperativeHandle(t,()=>({getPermissions(){const f=me(o.collectionTypes,l.collectionTypes),u=me(o.singleTypes,l.singleTypes),m={...f,...u};let b;return Z(m)?b=!1:b=Object.values(m).some((x={})=>Object.values(x).some(j=>U(j,"conditions"))),{permissionsToSend:Os(l),didUpdateConditions:b}},resetForm(){r({type:"RESET_FORM"})},setFormAfterSubmit(){r({type:"SET_FORM_AFTER_SUBMIT"})}}));const d=(f,u,m,b)=>{r({type:"ON_CHANGE_COLLECTION_TYPE_ROW_LEFT_CHECKBOX",pathToCollectionType:f,propertyName:u,rowName:m,value:b})},p=(f,u,m)=>{r({type:"ON_CHANGE_COLLECTION_TYPE_GLOBAL_ACTION_CHECKBOX",collectionTypeKind:f,actionId:u,value:m})},g=f=>{r({type:"ON_CHANGE_CONDITIONS",conditions:f})},h=A.useCallback(({target:{name:f,value:u}})=>{r({type:"ON_CHANGE_SIMPLE_CHECKBOX",keys:f,value:u})},[]),C=A.useCallback(({target:{name:f,value:u}})=>{r({type:"ON_CHANGE_TOGGLE_PARENT_CHECKBOX",keys:f,value:u})},[]);return n.jsx(ds,{availableConditions:e.conditions,modifiedData:l,onChangeConditions:g,onChangeSimpleCheckbox:h,onChangeParentCheckbox:C,onChangeCollectionTypeLeftActionRowCheckbox:d,onChangeCollectionTypeGlobalActionCheckbox:p,children:n.jsxs(H.Root,{defaultValue:X[0].id,children:[n.jsx(H.List,{"aria-label":c({id:"Settings.permissions.users.tabs.label",defaultMessage:"Tabs Permissions"}),children:X.map(f=>n.jsx(H.Trigger,{value:f.id,children:c({id:f.labelId,defaultMessage:f.defaultMessage})},f.id))}),n.jsx(H.Content,{value:X[0].id,children:n.jsx(ke,{layout:a.collectionTypes,kind:"collectionTypes",isFormDisabled:s})}),n.jsx(H.Content,{value:X[1].id,children:n.jsx(ke,{layout:a.singleTypes,kind:"singleTypes",isFormDisabled:s})}),n.jsx(H.Content,{value:X[2].id,children:n.jsx(Se,{layout:a.plugins,kind:"plugins",isFormDisabled:s})}),n.jsx(H.Content,{value:X[3].id,children:n.jsx(Se,{layout:a.settings,kind:"settings",isFormDisabled:s})})]})})}),ft={initialData:{},modifiedData:{},layouts:{}},xt=(e,s)=>Me(e,i=>{switch(s.type){case"ON_CHANGE_COLLECTION_TYPE_GLOBAL_ACTION_CHECKBOX":{const{collectionTypeKind:t,actionId:o,value:a}=s,l=["modifiedData",t];Object.keys(k(e,l)).forEach(r=>{const c=k(e,[...l,r,o],void 0);if(c){let d=q(c,a);if(!a&&d.conditions){const p=q(d.conditions,!1);d={...d,conditions:p}}R(i,[...l,r,o],d)}});break}case"ON_CHANGE_COLLECTION_TYPE_ROW_LEFT_CHECKBOX":{const{pathToCollectionType:t,propertyName:o,rowName:a,value:l}=s;let r=ie(e.modifiedData);const c=t.split(".."),d=k(r,c,{});Object.keys(d).forEach(p=>{if(U(d[p],`properties.${o}`)){const g=k(d,[p,"properties",o,a]),h=[...c,p,"properties",o,a];if(!I(g))R(r,h,l);else{const C=q(g,l);R(r,h,C)}}}),l||(r=Q(r)),R(i,"modifiedData",r);break}case"ON_CHANGE_CONDITIONS":{Object.entries(s.conditions).forEach(t=>{const[o,a]=t;R(i,["modifiedData",...o.split(".."),"conditions"],a)});break}case"ON_CHANGE_SIMPLE_CHECKBOX":{let t=ie(e.modifiedData);R(t,[...s.keys.split("..")],s.value),s.value||(t=Q(t)),R(i,"modifiedData",t);break}case"ON_CHANGE_TOGGLE_PARENT_CHECKBOX":{const{keys:t,value:o}=s,a=[...t.split("..")];let l=ie(e.modifiedData);const r=k(l,a,{}),c=q(r,o);R(l,a,c),o||(l=Q(l)),R(i,["modifiedData"],l);break}case"RESET_FORM":{i.modifiedData=e.initialData;break}case"SET_FORM_AFTER_SUBMIT":{i.initialData=e.modifiedData;break}default:return i}}),Ct=(e,s)=>{const{conditions:i,sections:{collectionTypes:t,singleTypes:o,plugins:a,settings:l}}=e,r={collectionTypes:t,singleTypes:o,plugins:je(a,"plugin"),settings:je(l,"category")},c={collectionTypes:be(t,i,s),singleTypes:be(o,i,s),plugins:Ce(r.plugins,i,s),settings:Ce(r.settings,i,s)};return{initialData:c,modifiedData:c,layouts:r}};export{At as P};

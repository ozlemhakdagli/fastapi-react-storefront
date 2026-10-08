

            <div class="box-header with-border">
              <h3 class="box-title">İletişim Bilgisi </h3>
            </div>
        
			
            <form role="form" action="<?=base_url()?>admin/home/iletisim_guncelle/<?=$veri[0]->Id?>" method="post">
			
				<table width="150">
				<tr><script src="<?=base_url()?>ckeditor/ckeditor.js" ></script>
				<div class="form-group">
				 <br>
				<textarea name="iletisim" id="iletisim" rows="10" ><?=$veri[0]->iletisim?></textarea>
				<script>CKEDITOR.replace('iletisim');</script>
				</div></tr>
                
				
				
			
				<tr><button type="submit" class="btn btn-primary">Kaydet</button></tr>
              </table>
              
			    </form>

              
               
				
          

